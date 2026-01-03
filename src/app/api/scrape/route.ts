import { NextRequest, NextResponse } from 'next/server'
import { getCountyByName } from '@/config/scrapers'
import { searchOSCN, OSCNCase } from '@/services/oscn'

interface EvictionRecord {
  caseNumber: string
  filingDate: string
  plaintiff: string
  defendant: string
  address: string
  status: string
  county: string
}

function generateMockEvictions(county: string, fromDate: string, toDate: string): EvictionRecord[] {
  const statuses = ['Filed', 'Pending', 'Judgment for Plaintiff', 'Dismissed', 'Default Judgment']
  const plaintiffs = [
    'ABC Property Management LLC',
    'Sunset Apartments LP',
    'Main Street Investments',
    'Texas Rental Properties Inc',
    'Lone Star Housing LLC',
    'Metro Living Partners',
    'Urban Dwellings Corp',
    'Premier Property Group'
  ]
  const streets = [
    'Main St', 'Oak Ave', 'Elm Dr', 'Cedar Ln', 'Pine Rd',
    'Maple Blvd', 'Walnut Way', 'Birch Ct', 'Ash Pl', 'Willow Ter'
  ]
  const firstNames = ['John', 'Maria', 'James', 'Sarah', 'Michael', 'Jennifer', 'David', 'Lisa', 'Robert', 'Emily']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']

  const records: EvictionRecord[] = []
  const numRecords = Math.floor(Math.random() * 30) + 20

  const from = new Date(fromDate)
  const to = new Date(toDate)
  const dayRange = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))

  for (let i = 0; i < numRecords; i++) {
    const randomDays = Math.floor(Math.random() * dayRange)
    const filingDate = new Date(from.getTime() + randomDays * 24 * 60 * 60 * 1000)
    
    const streetNum = Math.floor(Math.random() * 9000) + 1000
    const street = streets[Math.floor(Math.random() * streets.length)]
    const aptNum = Math.random() > 0.5 ? ` Apt ${Math.floor(Math.random() * 300) + 100}` : ''
    
    records.push({
      caseNumber: `JP${Math.floor(Math.random() * 5) + 1}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      filingDate: filingDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      plaintiff: plaintiffs[Math.floor(Math.random() * plaintiffs.length)],
      defendant: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      address: `${streetNum} ${street}${aptNum}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      county: county
    })
  }

  return records.sort((a, b) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime())
}

function generateMockForeclosures(county: string, fromDate: string, toDate: string) {
  const statuses = ['Notice of Default', 'Lis Pendens', 'Auction Scheduled', 'REO', 'Pre-Foreclosure']
  const lenders = [
    'Wells Fargo Bank NA',
    'Bank of America NA',
    'JPMorgan Chase Bank',
    'Citibank NA',
    'US Bank NA',
    'PNC Bank NA',
    'Truist Bank'
  ]
  const streets = [
    'Oakwood Dr', 'Sunset Blvd', 'Highland Ave', 'Meadow Ln', 'Valley Rd',
    'Creek Way', 'Forest Dr', 'Lake View Ct', 'Mountain Pass', 'River Bend'
  ]
  const firstNames = ['William', 'Patricia', 'Richard', 'Linda', 'Charles', 'Barbara', 'Joseph', 'Susan']
  const lastNames = ['Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Moore']

  const records = []
  const numRecords = Math.floor(Math.random() * 20) + 10

  const from = new Date(fromDate)
  const to = new Date(toDate)
  const dayRange = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))

  for (let i = 0; i < numRecords; i++) {
    const randomDays = Math.floor(Math.random() * dayRange)
    const filingDate = new Date(from.getTime() + randomDays * 24 * 60 * 60 * 1000)
    const auctionDate = new Date(filingDate.getTime() + (Math.random() * 60 + 30) * 24 * 60 * 60 * 1000)
    
    const streetNum = Math.floor(Math.random() * 9000) + 1000
    const street = streets[Math.floor(Math.random() * streets.length)]
    
    records.push({
      caseNumber: `FC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      filingDate: filingDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      auctionDate: auctionDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      owner: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      lender: lenders[Math.floor(Math.random() * lenders.length)],
      address: `${streetNum} ${street}`,
      amount: `$${(Math.floor(Math.random() * 400000) + 100000).toLocaleString()}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      county: county
    })
  }

  return records.sort((a, b) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime())
}

// Convert OSCN cases to eviction records format
function oscnToEvictionRecords(cases: OSCNCase[]): EvictionRecord[] {
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
  })) as any[]
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

function generateMockProbate(county: string, fromDate: string, toDate: string) {
  const statuses = ['Filed', 'Pending', 'Letters Issued', 'Closed', 'In Administration']
  const caseTypes = ['Independent Administration', 'Dependent Administration', 'Muniment of Title', 'Small Estate Affidavit']
  const streets = [
    'Heritage Ln', 'Colonial Dr', 'Estate Way', 'Manor Ct', 'Legacy Blvd',
    'Homestead Rd', 'Family Cir', 'Generations Ave', 'Memory Ln', 'Tradition Pl'
  ]
  const firstNames = ['George', 'Dorothy', 'Harold', 'Betty', 'Walter', 'Margaret', 'Eugene', 'Ruth']
  const lastNames = ['Wilson', 'Taylor', 'Clark', 'Lewis', 'Walker', 'Hall', 'Allen', 'Young']

  const records = []
  const numRecords = Math.floor(Math.random() * 15) + 8

  const from = new Date(fromDate)
  const to = new Date(toDate)
  const dayRange = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))

  for (let i = 0; i < numRecords; i++) {
    const randomDays = Math.floor(Math.random() * dayRange)
    const filingDate = new Date(from.getTime() + randomDays * 24 * 60 * 60 * 1000)
    
    const streetNum = Math.floor(Math.random() * 9000) + 1000
    const street = streets[Math.floor(Math.random() * streets.length)]
    const deceasedFirst = firstNames[Math.floor(Math.random() * firstNames.length)]
    const deceasedLast = lastNames[Math.floor(Math.random() * lastNames.length)]
    
    records.push({
      caseNumber: `PR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      filingDate: filingDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      decedent: `${deceasedFirst} ${deceasedLast}`,
      executor: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${deceasedLast}`,
      caseType: caseTypes[Math.floor(Math.random() * caseTypes.length)],
      propertyAddress: `${streetNum} ${street}`,
      estimatedValue: `$${(Math.floor(Math.random() * 500000) + 150000).toLocaleString()}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      county: county
    })
  }

  return records.sort((a, b) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime())
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
          try {
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
          } catch (error: any) {
            console.error(`[Scrape] OSCN error: ${error.message}, falling back to demo data`)
            results = generateMockEvictions(county, fromDate, toDate)
          }
        } else {
          results = generateMockEvictions(county, fromDate, toDate)
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
          try {
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
          } catch (error: any) {
            console.error(`[Scrape] OSCN error: ${error.message}, falling back to demo data`)
            results = generateMockForeclosures(county, fromDate, toDate)
          }
        } else {
          results = generateMockForeclosures(county, fromDate, toDate)
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
          try {
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
          } catch (error: any) {
            console.error(`[Scrape] OSCN error: ${error.message}, falling back to demo data`)
            results = generateMockProbate(county, fromDate, toDate)
          }
        } else {
          results = generateMockProbate(county, fromDate, toDate)
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
      note: isRealData 
        ? `Real data from ${dataSource} - Oklahoma State Courts Network` 
        : 'Demo data - Real scraping requires additional setup'
    })

  } catch (error: any) {
    console.error('[Scrape API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
