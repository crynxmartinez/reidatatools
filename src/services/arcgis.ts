import axios from 'axios'
import { getStateByCode } from '@/config/states'
import { PropertyData, SearchType, CSVRow, CountyConfig } from '@/types'
import { normalizeAddress, fuzzyMatch, extractHouseNumber, extractStreetToken } from '@/utils/addressUtils'

export async function processPropertyData(
  stateCode: string,
  selectedCountyIndex: string,
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

  // If a specific county is selected, use only that county
  // If "all" is selected, use all counties
  let countiesToQuery = state.counties
  if (selectedCountyIndex && selectedCountyIndex !== '' && selectedCountyIndex !== 'all') {
    const index = parseInt(selectedCountyIndex)
    if (!isNaN(index) && index >= 0 && index < state.counties.length) {
      countiesToQuery = [state.counties[index]]
    }
  }
  // If selectedCountyIndex is 'all' or empty, use all counties (default behavior)

  if (searchType === 'parcel') {
    return await searchByParcel(countiesToQuery, row)
  } else {
    return await searchByAddress(countiesToQuery, row)
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
    } catch (error: any) {
      console.error(`[${county.name}] Error querying parcel:`, error.message)
      // Continue to next county instead of failing
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
  // Normalize parcel ID - try with and without dashes
  const parcelIdNoDashes = parcelId.replace(/-/g, '')
  const parcelIdClean = parcelId.replace(/'/g, "''")
  const parcelIdNoDashesClean = parcelIdNoDashes.replace(/'/g, "''")
  
  // Try multiple query formats for better matching
  const queries = [
    `${county.parcelField} = '${parcelIdClean}'`,
    `${county.parcelField} = '${parcelIdNoDashesClean}'`,
    `UPPER(${county.parcelField}) = '${parcelIdClean.toUpperCase()}'`,
    `UPPER(${county.parcelField}) = '${parcelIdNoDashesClean.toUpperCase()}'`,
    `${county.parcelField} LIKE '%${parcelIdNoDashesClean}%'`
  ]
  
  console.log(`[${county.name}] Trying parcel ID:`, parcelId)
  console.log(`[${county.name}] URL:`, county.url)

  for (const where of queries) {
    const params = {
      f: 'json',
      where: where,
      outFields: county.outFields.join(','),
      returnGeometry: 'false',
      resultRecordCount: 5
    }

    console.log(`[${county.name}] Query:`, where)

    try {
      // Use proxy to avoid CORS issues
      const proxyUrl = `/api/arcgis-proxy?url=${encodeURIComponent(county.url + '/query')}`
      const queryParams = new URLSearchParams(params as any)
      const response = await axios.get(`${proxyUrl}&${queryParams.toString()}`, { timeout: 30000 })
      const features = response.data.features || []

      console.log(`[${county.name}] Results:`, features.length, 'features')

      if (features.length > 0) {
        const attrs = features[0].attributes
        return mapAttributesToPropertyData(county, attrs, { inputParcelId: parcelId }, 100)
      }
    } catch (error: any) {
      console.error(`[${county.name}] Query error:`, error.message)
      // Continue to next query format
    }
  }

  // No matches found with any query format
  return null
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

  // Build multiple query strategies - from most specific to broadest
  const queries: string[] = []
  
  if (county.situsField) {
    // Strategy 1: Exact house number + street token + city
    if (streetToken && city) {
      const cleanCity = city.toUpperCase().replace(/'/g, "''")
      queries.push(`UPPER(${county.situsField}) LIKE '${houseNumber} %${streetToken}%' AND UPPER(${county.cityField || county.situsField}) LIKE '%${cleanCity}%'`)
    }
    // Strategy 2: Exact house number + street token (no city filter)
    if (streetToken) {
      queries.push(`UPPER(${county.situsField}) LIKE '${houseNumber} %${streetToken}%'`)
    }
    // Strategy 3: Just house number + city
    if (city) {
      const cleanCity = city.toUpperCase().replace(/'/g, "''")
      queries.push(`UPPER(${county.situsField}) LIKE '${houseNumber} %' AND UPPER(${county.cityField || county.situsField}) LIKE '%${cleanCity}%'`)
    }
    // Strategy 4: Just house number (broadest)
    queries.push(`UPPER(${county.situsField}) LIKE '${houseNumber} %'`)
  } else if (county.name.includes('Dallas')) {
    // Dallas-specific queries using ST_NUM and ST_NAME fields
    // Strategy 1: Exact house number + street token + city
    if (streetToken && city) {
      const cleanCity = city.toUpperCase().replace(/'/g, "''")
      queries.push(`ST_NUM = '${houseNumber}' AND UPPER(ST_NAME) LIKE '%${streetToken}%' AND UPPER(CITY) LIKE '%${cleanCity}%'`)
    }
    // Strategy 2: Exact house number + street token (no city filter)
    if (streetToken) {
      queries.push(`ST_NUM = '${houseNumber}' AND UPPER(ST_NAME) LIKE '%${streetToken}%'`)
    }
    // Strategy 3: Just house number + city
    if (city) {
      const cleanCity = city.toUpperCase().replace(/'/g, "''")
      queries.push(`ST_NUM = '${houseNumber}' AND UPPER(CITY) LIKE '%${cleanCity}%'`)
    }
    // Strategy 4: Just house number (broadest - will return many results, rely on fuzzy matching)
    queries.push(`ST_NUM = '${houseNumber}'`)
  } else {
    return null
  }

  console.log(`[${county.name}] Searching for: "${address}" (house: ${houseNumber}, street: ${streetToken})`)

  for (const where of queries) {
    const params = {
      f: 'json',
      where: where,
      outFields: county.outFields.join(','),
      returnGeometry: 'false',
      resultRecordCount: 50
    }

    console.log(`[${county.name}] Query:`, where)

    try {
      const proxyUrl = `/api/arcgis-proxy?url=${encodeURIComponent(county.url + '/query')}`
      const queryParams = new URLSearchParams(params as any)
      const response = await axios.get(`${proxyUrl}&${queryParams.toString()}`, { timeout: 30000 })
      const features = response.data.features || []

      console.log(`[${county.name}] Results:`, features.length, 'features')

      if (features.length === 0) {
        continue // Try next query strategy
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
          ].filter(p => p && String(p).trim() !== 'None' && String(p).trim() !== '')
          situsAddress = normalizeAddress(parts.join(' '))
        }

        const score = fuzzyMatch(normalizedAddr, situsAddress)

        console.log(`  Comparing: "${normalizedAddr}" vs "${situsAddress}" = ${score}%`)

        // Skip ZIP mismatch only if we have a ZIP and the feature has one
        if (zip && county.zipField) {
          const featureZip = String(attrs[county.zipField] || '').trim()
          if (featureZip && featureZip.substring(0, 5) !== zip.substring(0, 5)) {
            console.log(`  Skipping: ZIP mismatch (${featureZip} vs ${zip})`)
            continue
          }
        }

        if (score > bestScore && score >= 70) { // Lowered threshold from 75 to 70
          bestScore = score
          bestMatch = attrs
          console.log(`  New best match! Score: ${score}%`)
        }
      }

      if (bestMatch) {
        return mapAttributesToPropertyData(
          county,
          bestMatch,
          { inputAddress: address, inputCity: city, inputState: 'TX', inputZip: zip },
          bestScore
        )
      }
    } catch (error: any) {
      console.error(`[${county.name}] Query error:`, error.message)
    }
  }

  return null
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
