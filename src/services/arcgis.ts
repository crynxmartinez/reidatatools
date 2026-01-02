import axios from 'axios'
import { getStateByCode } from '@/config/states'
import { PropertyData, SearchType, CSVRow, CountyConfig } from '@/types'
import { normalizeAddress, fuzzyMatch, extractHouseNumber, extractStreetToken } from '@/utils/addressUtils'

export async function processPropertyData(
  stateCode: string,
  searchType: SearchType,
  row: CSVRow
): Promise<PropertyData> {
  const state = getStateByCode(stateCode)
  
  if (!state || !state.counties || state.counties.length === 0) {
    return {
      id: Math.random().toString(36),
      source: stateCode,
      status: 'error',
      inputAddress: row['property address'],
      inputCity: row['property city'],
      inputState: row['property state'],
      inputZip: row['property zip'],
      inputParcelId: row['parcel id'],
    }
  }

  if (searchType === 'parcel') {
    return await searchByParcel(state.counties, row)
  } else {
    return await searchByAddress(state.counties, row)
  }
}

async function searchByParcel(
  counties: CountyConfig[],
  row: CSVRow
): Promise<PropertyData> {
  const parcelId = row['parcel id']?.trim()
  
  if (!parcelId) {
    return {
      id: Math.random().toString(36),
      source: 'Unknown',
      status: 'error',
      inputParcelId: parcelId,
    }
  }

  for (const county of counties) {
    try {
      const result = await queryByParcel(county, parcelId)
      if (result) {
        return result
      }
    } catch (error) {
      console.error(`Error querying ${county.name}:`, error)
    }
  }

  return {
    id: Math.random().toString(36),
    source: counties[0].name,
    status: 'no_match',
    inputParcelId: parcelId,
  }
}

async function queryByParcel(
  county: CountyConfig,
  parcelId: string
): Promise<PropertyData | null> {
  const where = `${county.parcelField} = '${parcelId.replace(/'/g, "''")}'`
  
  const params = {
    f: 'json',
    where: where,
    outFields: county.outFields.join(','),
    returnGeometry: 'false',
    resultRecordCount: 1
  }

  const response = await axios.get(`${county.url}/query`, { params, timeout: 30000 })
  const features = response.data.features || []

  if (features.length === 0) {
    return null
  }

  const attrs = features[0].attributes
  return mapAttributesToPropertyData(county, attrs, { inputParcelId: parcelId }, 100)
}

async function searchByAddress(
  counties: CountyConfig[],
  row: CSVRow
): Promise<PropertyData> {
  const address = row['property address']?.trim()
  const city = row['property city']?.trim()
  const state = row['property state']?.trim()
  const zip = row['property zip']?.trim()

  if (!address) {
    return {
      id: Math.random().toString(36),
      source: 'Unknown',
      status: 'error',
      inputAddress: address,
      inputCity: city,
      inputState: state,
      inputZip: zip,
    }
  }

  for (const county of counties) {
    try {
      const result = await queryByAddress(county, address, city, zip)
      if (result) {
        return result
      }
    } catch (error) {
      console.error(`Error querying ${county.name}:`, error)
    }
  }

  return {
    id: Math.random().toString(36),
    source: counties[0].name,
    status: 'no_match',
    inputAddress: address,
    inputCity: city,
    inputState: state,
    inputZip: zip,
  }
}

async function queryByAddress(
  county: CountyConfig,
  address: string,
  city?: string,
  zip?: string
): Promise<PropertyData | null> {
  const normalizedAddr = normalizeAddress(address)
  const houseNumber = extractHouseNumber(normalizedAddr)
  const streetToken = extractStreetToken(normalizedAddr)

  if (!houseNumber) {
    return null
  }

  let where = ''
  
  if (county.situsField) {
    where = `UPPER(${county.situsField}) LIKE '${houseNumber} %'`
    if (streetToken) {
      where += ` AND UPPER(${county.situsField}) LIKE '% ${streetToken} %'`
    }
  } else if (county.name.includes('Dallas')) {
    where = `ST_NUM = '${houseNumber}'`
    if (streetToken) {
      where += ` AND UPPER(ST_NAME) LIKE '%${streetToken}%'`
    }
  } else {
    return null
  }

  if (city && county.cityField) {
    const cleanCity = city.toUpperCase().replace(/'/g, "''")
    where += ` AND UPPER(${county.cityField}) LIKE '%${cleanCity}%'`
  }

  const params = {
    f: 'json',
    where: where,
    outFields: county.outFields.join(','),
    returnGeometry: 'false',
    resultRecordCount: 25
  }

  console.log(`[${county.name}] Query:`, where)
  console.log(`[${county.name}] URL:`, county.url)

  try {
    const response = await axios.get(`${county.url}/query`, { params, timeout: 30000 })
    const features = response.data.features || []

    console.log(`[${county.name}] Results:`, features.length, 'features')

    if (features.length === 0) {
      return null
    }

    let bestMatch = null
    let bestScore = 0

    for (const feature of features) {
      const attrs = feature.attributes
      let situsAddress = ''

    if (county.situsField) {
      situsAddress = normalizeAddress(attrs[county.situsField] || '')
    } else if (county.name.includes('Dallas')) {
      const parts = [
        attrs.ST_NUM,
        attrs.ST_DIR,
        attrs.ST_NAME,
        attrs.ST_TYPE,
        attrs.UNITID
      ].filter(p => p && String(p).trim() !== 'None')
      situsAddress = normalizeAddress(parts.join(' '))
    }

    const score = fuzzyMatch(normalizedAddr, situsAddress)

    console.log(`  Comparing: "${normalizedAddr}" vs "${situsAddress}" = ${score}%`)

    if (zip && county.zipField) {
      const featureZip = String(attrs[county.zipField] || '').trim()
      if (featureZip && featureZip !== zip) {
        console.log(`  Skipping: ZIP mismatch (${featureZip} vs ${zip})`)
        continue
      }
    }

      if (score > bestScore && score >= 75) {
        bestScore = score
        bestMatch = attrs
        console.log(`  New best match! Score: ${score}%`)
      }
    }

    if (!bestMatch) {
      return null
    }

    return mapAttributesToPropertyData(
      county,
      bestMatch,
      { inputAddress: address, inputCity: city, inputState: zip ? 'TX' : '', inputZip: zip },
      bestScore
    )
  } catch (error: any) {
    console.error(`[${county.name}] Error:`, error.message)
    return null
  }
}

function mapAttributesToPropertyData(
  county: CountyConfig,
  attrs: any,
  inputData: Partial<PropertyData>,
  matchScore: number
): PropertyData {
  let siteAddress = ''
  
  if (county.situsField) {
    siteAddress = attrs[county.situsField] || ''
  } else if (county.name.includes('Dallas')) {
    const parts = [
      attrs.ST_NUM,
      attrs.ST_DIR,
      attrs.ST_NAME,
      attrs.ST_TYPE,
      attrs.UNITID
    ].filter(p => p && String(p).trim() !== 'None')
    siteAddress = parts.join(' ')
  }

  const mailingState = county.mailingStateField 
    ? attrs[county.mailingStateField] 
    : 'TX'

  let mailingZip = attrs[county.mailingZipField] || ''
  const mailingZip4 = attrs[county.mailingZipField + '_'] || attrs['OWNER_ZIP_'] || ''
  if (mailingZip && mailingZip4) {
    mailingZip = `${mailingZip}-${mailingZip4}`
  }

  return {
    id: Math.random().toString(36),
    source: county.name,
    status: 'matched',
    matchScore: Math.round(matchScore),
    ...inputData,
    parcelId: attrs[county.parcelField] || '',
    siteAddress: siteAddress.trim(),
    ownerName: attrs[county.ownerField] || '',
    ownerName2: attrs[county.ownerField + '2'] || attrs['OWNERNME2'] || attrs['TAXPANAME2'] || '',
    mailingAddress: attrs[county.mailingAddressField] || '',
    mailingCity: attrs[county.mailingCityField] || '',
    mailingState: mailingState,
    mailingZip: mailingZip,
    county: attrs.COUNTY || attrs.CONAME || county.name,
    assessedValue: attrs.CNTASSDVALUE || attrs.ASSESSED_VALUE || undefined,
    landValue: attrs.LNDVALUE || attrs.LAND_VALUE || undefined,
    improvementValue: attrs.IMPVALUE || attrs.IMP_VALUE || undefined,
    acres: attrs.GISACRES || attrs.DEEDACRES || attrs.ACRES || undefined,
    propertyType: attrs.PROPCLASS || attrs.PROPERTY_TYPE || attrs.UseType || undefined,
    taxYear: attrs.TAXROLLYEAR || attrs.TAX_YEAR || undefined,
  }
}
