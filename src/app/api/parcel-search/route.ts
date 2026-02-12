import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getStateByCode } from '@/config/states'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { streetAddress, stateCode, countyIndex } = body

    if (!streetAddress || !stateCode) {
      return NextResponse.json(
        { error: 'Missing required fields: streetAddress, stateCode' },
        { status: 400 }
      )
    }

    const state = getStateByCode(stateCode)
    if (!state || !state.counties || state.counties.length === 0) {
      return NextResponse.json(
        { error: `No county data configured for state ${stateCode}` },
        { status: 404 }
      )
    }

    const idx = countyIndex !== undefined ? parseInt(countyIndex) : 0
    const county = state.counties[idx] || state.counties[0]

    // Extract street name from hundred-block address like "1XX N 31ST AV"
    // Remove the masked house number (digits followed by XX)
    const streetName = streetAddress
      .replace(/^\d*XX?\s+/i, '')  // Remove "1XX ", "25XX ", etc.
      .replace(/^\d+\s+/i, '')     // Remove normal house numbers too
      .trim()
      .toUpperCase()

    if (!streetName) {
      return NextResponse.json(
        { error: 'Could not extract street name from address' },
        { status: 400 }
      )
    }

    // Also extract the hundred block number for narrowing results
    const blockMatch = streetAddress.match(/^(\d+)XX?\s/i)
    const blockNumber = blockMatch ? blockMatch[1] : null

    // Build ArcGIS query - search for parcels on this street
    let where = ''
    if (county.situsField) {
      if (blockNumber) {
        // Search for addresses in the hundred block range (e.g., 100-199 for "1XX")
        const blockStart = parseInt(blockNumber) * 100
        const blockEnd = blockStart + 99
        // Use street name match + try to narrow by block
        where = `UPPER(${county.situsField}) LIKE '%${streetName}%'`
      } else {
        where = `UPPER(${county.situsField}) LIKE '%${streetName}%'`
      }
    } else {
      return NextResponse.json(
        { error: `County ${county.name} does not have a situs address field configured` },
        { status: 400 }
      )
    }

    console.log(`[Parcel Search] Street: "${streetName}", Block: ${blockNumber || 'N/A'}`)
    console.log(`[Parcel Search] County: ${county.name}, Query: ${where}`)

    const params = {
      f: 'json',
      where,
      outFields: county.outFields.join(','),
      returnGeometry: 'false',
      resultRecordCount: '50'
    }

    const queryUrl = `${county.url}/query`
    const queryParams = new URLSearchParams(params)
    const response = await axios.get(`${queryUrl}?${queryParams.toString()}`, { timeout: 30000 })

    const features = response.data.features || []
    console.log(`[Parcel Search] Found ${features.length} parcels`)

    // Filter to just the hundred block if we have a block number
    let results = features.map((f: any) => f.attributes)

    if (blockNumber) {
      const blockStart = parseInt(blockNumber) * 100
      const blockEnd = blockStart + 99
      results = results.filter((attrs: any) => {
        const addr = attrs[county.situsField!] || ''
        const houseNumMatch = addr.match(/^(\d+)/)
        if (houseNumMatch) {
          const num = parseInt(houseNumMatch[1])
          return num >= blockStart && num <= blockEnd
        }
        return true // Keep if we can't parse
      })
    }

    // Map to clean format
    const parcels = results.map((attrs: any) => ({
      parcelId: attrs[county.parcelField] || '',
      address: attrs[county.situsField!] || '',
      city: county.cityField ? attrs[county.cityField] || '' : '',
      zip: county.zipField ? attrs[county.zipField] || '' : '',
      ownerName: attrs[county.ownerField] || '',
      mailingAddress: attrs[county.mailingAddressField] || '',
      mailingCity: county.mailingCityField ? attrs[county.mailingCityField] || '' : '',
      mailingState: county.mailingStateField ? attrs[county.mailingStateField] || '' : '',
      mailingZip: attrs[county.mailingZipField] || '',
      saleDate: attrs['SALE_DATE'] || '',
      salePrice: attrs['SALE_PRICE'] || '',
      assessedValue: attrs['FCV_CUR'] || attrs['CNTASSDVALUE'] || '',
    }))

    return NextResponse.json({
      success: true,
      streetName,
      blockNumber: blockNumber || null,
      county: county.name,
      count: parcels.length,
      parcels
    })

  } catch (error: any) {
    console.error('[Parcel Search] Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
