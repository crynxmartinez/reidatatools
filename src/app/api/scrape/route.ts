import { NextRequest, NextResponse } from 'next/server'
import { getCountyByName } from '@/config/scrapers'
import { searchOSCN, OSCNCase } from '@/services/oscn'

// Render scraper worker URL
const SCRAPER_WORKER_URL = process.env.SCRAPER_WORKER_URL || 'https://rei-scraper-worker.onrender.com'

// Call Render worker for Texas court scraping
async function scrapeWithRenderWorker(county: string, type: string, fromDate: string, toDate: string) {
  const response = await fetch(`${SCRAPER_WORKER_URL}/scrape/texas-courts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ county, type, fromDate, toDate })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Scraper worker returned ${response.status}`)
  }
  
  return await response.json()
}

// Convert OSCN cases to eviction records format
function oscnToEvictionRecords(cases: OSCNCase[]) {
  return cases.map(c => ({
    caseNumber: c.caseNumber,
    filingDate: c.filingDate,
    plaintiff: c.plaintiff,
    defendant: c.defendant,
    address: 'See Case Details',
    status: c.status,
    county: c.county,
    caseType: c.caseTypeDescription,
    link: c.link
  }))
}

// Convert OSCN cases to foreclosure records format
function oscnToForeclosureRecords(cases: OSCNCase[]) {
  return cases.map(c => ({
    caseNumber: c.caseNumber,
    filingDate: c.filingDate,
    auctionDate: '',
    owner: c.defendant,
    lender: c.plaintiff,
    address: 'See Case Details',
    amount: '',
    status: c.status,
    county: c.county,
    caseType: c.caseTypeDescription,
    link: c.link
  }))
}

// Convert OSCN cases to probate records format
function oscnToProbateRecords(cases: OSCNCase[]) {
  return cases.map(c => ({
    caseNumber: c.caseNumber,
    filingDate: c.filingDate,
    decedent: c.defendant || 'See Case Details',
    executor: c.plaintiff || 'See Case Details',
    caseType: c.caseTypeDescription,
    propertyAddress: 'See Case Details',
    estimatedValue: '',
    status: c.status,
    county: c.county,
    link: c.link
  }))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, county, fromDate, toDate } = body

    if (!type || !county) {
      return NextResponse.json(
        { error: 'Missing required fields: type and county' },
        { status: 400 }
      )
    }

    const countyConfig = getCountyByName(county)
    if (!countyConfig) {
      return NextResponse.json(
        { error: `County "${county}" not found in configuration` },
        { status: 404 }
      )
    }

    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500))

    let results: any[] = []
    let isRealData = false
    let dataSource = 'Demo'

    // Check if this is an Oklahoma county using OSCN
    const isOSCN = countyConfig.state === 'OK' && countyConfig.oscnCode

    switch (type) {
      case 'evictions':
        if (!countyConfig.evictions) {
          return NextResponse.json(
            { error: `Eviction data not available for ${county} County` },
            { status: 404 }
          )
        }
        
        if (isOSCN && countyConfig.evictions.method === 'oscn') {
          console.log(`[Scrape] Fetching OSCN evictions for ${county} County, OK`)
          const oscnCases = await searchOSCN({
            county: countyConfig.oscnCode!,
            caseTypes: countyConfig.evictions.caseTypes || ['SC', 'CS'],
            fromDate,
            toDate
          })
          results = oscnToEvictionRecords(oscnCases)
          isRealData = true
          dataSource = 'OSCN'
        } else if (countyConfig.state === 'TX') {
          // Texas counties - use Render worker with Puppeteer
          console.log(`[Scrape] Calling Render worker for ${county} County, TX evictions`)
          try {
            const workerResponse = await scrapeWithRenderWorker(county, type, fromDate, toDate)
            results = workerResponse.results || []
            isRealData = results.length > 0
            dataSource = 'Render Worker (Puppeteer)'
          } catch (error: any) {
            console.error(`[Scrape] Render worker error: ${error.message}`)
            return NextResponse.json(
              { 
                error: `Failed to scrape ${county} County: ${error.message}`,
                sourceUrl: countyConfig.evictions.searchUrl
              },
              { status: 503 }
            )
          }
        } else {
          return NextResponse.json(
            { error: `No scraper available for ${county} County, ${countyConfig.state}` },
            { status: 501 }
          )
        }
        break

      case 'foreclosures':
        if (!countyConfig.foreclosures) {
          return NextResponse.json(
            { error: `Foreclosure data not available for ${county} County` },
            { status: 404 }
          )
        }
        
        if (isOSCN && countyConfig.foreclosures.method === 'oscn') {
          console.log(`[Scrape] Fetching OSCN foreclosures for ${county} County, OK`)
          const oscnCases = await searchOSCN({
            county: countyConfig.oscnCode!,
            caseTypes: countyConfig.foreclosures.caseTypes || ['CV', 'CJ'],
            fromDate,
            toDate
          })
          results = oscnToForeclosureRecords(oscnCases)
          isRealData = true
          dataSource = 'OSCN'
        } else if (countyConfig.state === 'TX') {
          // Texas counties - use Render worker with Puppeteer
          console.log(`[Scrape] Calling Render worker for ${county} County, TX foreclosures`)
          try {
            const workerResponse = await scrapeWithRenderWorker(county, type, fromDate, toDate)
            results = workerResponse.results || []
            isRealData = results.length > 0
            dataSource = 'Render Worker (Puppeteer)'
          } catch (error: any) {
            console.error(`[Scrape] Render worker error: ${error.message}`)
            return NextResponse.json(
              { 
                error: `Failed to scrape ${county} County: ${error.message}`,
                sourceUrl: countyConfig.foreclosures.searchUrl
              },
              { status: 503 }
            )
          }
        } else {
          return NextResponse.json(
            { error: `No scraper available for ${county} County, ${countyConfig.state}` },
            { status: 501 }
          )
        }
        break

      case 'probate':
        if (!countyConfig.probate) {
          return NextResponse.json(
            { error: `Probate data not available for ${county} County` },
            { status: 404 }
          )
        }
        
        if (isOSCN && countyConfig.probate.method === 'oscn') {
          console.log(`[Scrape] Fetching OSCN probate for ${county} County, OK`)
          const oscnCases = await searchOSCN({
            county: countyConfig.oscnCode!,
            caseTypes: countyConfig.probate.caseTypes || ['PB', 'PG'],
            fromDate,
            toDate
          })
          results = oscnToProbateRecords(oscnCases)
          isRealData = true
          dataSource = 'OSCN'
        } else if (countyConfig.state === 'TX') {
          // Texas counties - use Render worker with Puppeteer
          console.log(`[Scrape] Calling Render worker for ${county} County, TX probate`)
          try {
            const workerResponse = await scrapeWithRenderWorker(county, type, fromDate, toDate)
            results = workerResponse.results || []
            isRealData = results.length > 0
            dataSource = 'Render Worker (Puppeteer)'
          } catch (error: any) {
            console.error(`[Scrape] Render worker error: ${error.message}`)
            return NextResponse.json(
              { 
                error: `Failed to scrape ${county} County: ${error.message}`,
                sourceUrl: countyConfig.probate.searchUrl
              },
              { status: 503 }
            )
          }
        } else {
          return NextResponse.json(
            { error: `No scraper available for ${county} County, ${countyConfig.state}` },
            { status: 501 }
          )
        }
        break

      default:
        return NextResponse.json(
          { error: `Unknown scrape type: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      county,
      state: countyConfig.state,
      type,
      count: results.length,
      results,
      isRealData,
      dataSource,
      note: `Real data from ${dataSource} - Oklahoma State Courts Network`
    })

  } catch (error: any) {
    console.error('[Scrape API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
