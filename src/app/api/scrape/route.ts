import { NextRequest, NextResponse } from 'next/server'
import { getCountyByName } from '@/config/scrapers'
import { searchOSCN, searchOSCNWithDetails, OSCNCase } from '@/services/oscn'

// Render scraper worker URL
const SCRAPER_WORKER_URL = process.env.SCRAPER_WORKER_URL || 'https://rei-scraper-worker.onrender.com'

// Call Render worker for Texas court scraping
async function scrapeWithRenderWorker(county: string, type: string, fromDate: string, toDate: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch(`${SCRAPER_WORKER_URL}/scrape/texas-courts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ county, type, fromDate, toDate }),
      signal: controller.signal
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Scraper worker returned ${response.status}`)
    }
    
    return await response.json()
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Scraper worker timed out after 30 seconds. The worker may be starting up — try again in a minute.')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

// Call Render worker for Arizona court/recorder scraping
async function scrapeArizona(county: string, type: string, fromDate: string, toDate: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch(`${SCRAPER_WORKER_URL}/scrape/arizona-courts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ county, type, fromDate, toDate }),
      signal: controller.signal
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Arizona scraper returned ${response.status}`)
    }
    
    return await response.json()
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Arizona scraper timed out after 30 seconds. The worker may not have this endpoint yet.')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
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
    address: c.propertyAddress || 'See Case Details',
    amount: c.amount || '',
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
    propertyAddress: c.propertyAddress || 'See Case Details',
    estimatedValue: c.amount || '',
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
          console.log(`[Scrape] Fetching OSCN evictions with details for ${county} County, OK`)
          const oscnCases = await searchOSCNWithDetails({
            county: countyConfig.oscnCode!,
            caseTypes: countyConfig.evictions.caseTypes || ['SC', 'CS'],
            fromDate,
            toDate
          }, 25)
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
        } else if (countyConfig.state === 'AZ') {
          console.log(`[Scrape] Calling Arizona scraper for ${county} County, AZ evictions`)
          try {
            const workerResponse = await scrapeArizona(county, type, fromDate, toDate)
            results = workerResponse.results || []
            isRealData = results.length > 0
            dataSource = 'Arizona Courts (Puppeteer)'
          } catch (error: any) {
            console.error(`[Scrape] Arizona scraper error: ${error.message}`)
            return NextResponse.json(
              { 
                error: `Failed to scrape ${county} County, AZ: ${error.message}`,
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
          console.log(`[Scrape] Fetching OSCN foreclosures with details for ${county} County, OK`)
          const oscnCases = await searchOSCNWithDetails({
            county: countyConfig.oscnCode!,
            caseTypes: countyConfig.foreclosures.caseTypes || ['CV', 'CJ'],
            fromDate,
            toDate
          }, 25) // Fetch details for up to 25 cases
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
        } else if (countyConfig.state === 'AZ') {
          console.log(`[Scrape] Calling Arizona scraper for ${county} County, AZ foreclosures`)
          try {
            const workerResponse = await scrapeArizona(county, type, fromDate, toDate)
            results = workerResponse.results || []
            isRealData = results.length > 0
            dataSource = 'Maricopa County Recorder'
          } catch (error: any) {
            console.error(`[Scrape] Arizona scraper error: ${error.message}`)
            return NextResponse.json(
              { 
                error: `Failed to scrape ${county} County, AZ: ${error.message}`,
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
          console.log(`[Scrape] Fetching OSCN probate with details for ${county} County, OK`)
          const oscnCases = await searchOSCNWithDetails({
            county: countyConfig.oscnCode!,
            caseTypes: countyConfig.probate.caseTypes || ['PB', 'PG'],
            fromDate,
            toDate
          }, 25) // Fetch details for up to 25 cases
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
        } else if (countyConfig.state === 'AZ') {
          console.log(`[Scrape] Calling Arizona scraper for ${county} County, AZ probate`)
          try {
            const workerResponse = await scrapeArizona(county, type, fromDate, toDate)
            results = workerResponse.results || []
            isRealData = results.length > 0
            dataSource = 'Maricopa County Superior Court'
          } catch (error: any) {
            console.error(`[Scrape] Arizona scraper error: ${error.message}`)
            return NextResponse.json(
              { 
                error: `Failed to scrape ${county} County, AZ: ${error.message}`,
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
      note: isRealData ? `Real data from ${dataSource}` : `No results from ${dataSource}`
    })

  } catch (error: any) {
    console.error('[Scrape API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
