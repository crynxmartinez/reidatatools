// OSCN (Oklahoma State Courts Network) Service
// Fetches court records from Oklahoma's free public court database
// Uses cheerio for robust HTML parsing

import * as cheerio from 'cheerio'

export interface OSCNCase {
  caseNumber: string
  filingDate: string
  caseType: string
  caseTypeDescription: string
  plaintiff: string
  defendant: string
  judge?: string
  status: string
  county: string
  link: string
  propertyAddress?: string
  amount?: string
  attorneys?: string[]
}

export interface OSCNSearchParams {
  county: string
  caseTypes: string[]
  fromDate?: string
  toDate?: string
  partyName?: string
}

const OSCN_COUNTIES: Record<string, string> = {
  'oklahoma': 'oklahoma',
  'tulsa': 'tulsa',
  'cleveland': 'cleveland',
  'canadian': 'canadian',
  'comanche': 'comanche',
  'rogers': 'rogers',
  'wagoner': 'wagoner',
  'creek': 'creek',
  'payne': 'payne',
  'pottawatomie': 'pottawatomie',
  'garfield': 'garfield',
  'muskogee': 'muskogee',
  'leflore': 'leflore',
  'stephens': 'stephens',
  'carter': 'carter',
  'bryan': 'bryan',
  'pontotoc': 'pontotoc',
  'mcclain': 'mcclain',
  'grady': 'grady',
  'logan': 'logan'
}

const CASE_TYPE_DESCRIPTIONS: Record<string, string> = {
  'SC': 'Small Claims',
  'CS': 'Civil Small Claims',
  'CV': 'Civil',
  'CJ': 'Civil General',
  'FD': 'Forcible Entry & Detainer',
  'PB': 'Probate',
  'PG': 'Guardianship',
  'CF': 'Criminal Felony',
  'CM': 'Criminal Misdemeanor',
  'TR': 'Traffic',
  'JD': 'Juvenile Delinquent',
  'JM': 'Juvenile Miscellaneous'
}

const FETCH_HEADERS = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Cache-Control': 'no-cache'
}

async function fetchWithTimeout(url: string, timeoutMs: number = 15000): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: FETCH_HEADERS,
      signal: controller.signal
    })
    if (!response.ok) {
      console.error(`[OSCN] HTTP ${response.status} for ${url}`)
      return null
    }
    return await response.text()
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error(`[OSCN] Timeout fetching: ${url}`)
    } else {
      console.error(`[OSCN] Fetch error: ${err.message}`)
    }
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function parseOSCNSearchResults(html: string, county: string): OSCNCase[] {
  const $ = cheerio.load(html)
  const cases: OSCNCase[] = []
  const seenCases = new Set<string>()

  // OSCN search results: find all links to case pages
  $('a[href*="GetCaseInformation.aspx"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const dbMatch = href.match(/db=([^&]+)/)
    const numMatch = href.match(/number=([^&"]+)/)
    if (!dbMatch || !numMatch) return

    const db = dbMatch[1]
    const caseNumber = decodeURIComponent(numMatch[1])
    if (seenCases.has(caseNumber)) return
    seenCases.add(caseNumber)

    // Case type from case number prefix
    const typeMatch = caseNumber.match(/^([A-Z]{2})/i)
    const caseType = typeMatch ? typeMatch[1].toUpperCase() : ''

    // Walk up to the containing row/element to extract sibling data
    const row = $(el).closest('tr')
    const cells = row.find('td')
    let filingDate = ''
    let plaintiff = ''
    let defendant = ''
    let status = 'Filed'

    if (cells.length >= 2) {
      // Try to extract data from table cells
      cells.each((i, cell) => {
        const text = $(cell).text().trim()
        // Date pattern
        if (!filingDate && /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text)) {
          filingDate = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/)?.[1] || ''
        }
      })
    }

    // Try to get case style (plaintiff v. defendant) from the link text or row
    const rowText = row.text()
    const vsMatch = rowText.match(/(.+?)\s+(?:vs?\.?|versus)\s+(.+)/i)
    if (vsMatch) {
      plaintiff = vsMatch[1].replace(/[\s\n\r]+/g, ' ').trim()
      defendant = vsMatch[2].replace(/[\s\n\r]+/g, ' ').trim()
      // Clean up: remove case number from plaintiff if it got captured
      plaintiff = plaintiff.replace(new RegExp(caseNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '').trim()
      // Remove date from defendant tail
      defendant = defendant.replace(/\d{1,2}\/\d{1,2}\/\d{2,4}.*$/, '').trim()
      // Truncate
      plaintiff = plaintiff.substring(0, 120)
      defendant = defendant.substring(0, 120)
    }

    // If no row-level data, try the link text itself
    if (!plaintiff && !defendant) {
      const linkText = $(el).text().trim()
      const linkVs = linkText.match(/(.+?)\s+(?:vs?\.?|versus)\s+(.+)/i)
      if (linkVs) {
        plaintiff = linkVs[1].trim().substring(0, 120)
        defendant = linkVs[2].trim().substring(0, 120)
      }
    }

    // Look for status in row
    const statusMatch = rowText.match(/(?:Disposed|Closed|Dismissed|Judgment|Pending|Active)/i)
    if (statusMatch) status = statusMatch[0]

    cases.push({
      caseNumber,
      filingDate,
      caseType,
      caseTypeDescription: CASE_TYPE_DESCRIPTIONS[caseType] || caseType,
      plaintiff: plaintiff || 'See Case Details',
      defendant: defendant || 'See Case Details',
      status,
      county: county.charAt(0).toUpperCase() + county.slice(1),
      link: `https://www.oscn.net/dockets/GetCaseInformation.aspx?db=${db}&number=${encodeURIComponent(caseNumber)}`
    })
  })

  console.log(`[OSCN] Parsed ${cases.length} cases from search results`)
  return cases
}

export async function searchOSCN(params: OSCNSearchParams): Promise<OSCNCase[]> {
  const { county, caseTypes, fromDate, toDate } = params

  const countyCode = OSCN_COUNTIES[county.toLowerCase()]
  if (!countyCode) {
    throw new Error(`Unknown OSCN county: ${county}`)
  }

  const allCases: OSCNCase[] = []

  for (const caseType of caseTypes) {
    try {
      const searchUrl = new URL('https://www.oscn.net/dockets/Results.aspx')
      searchUrl.searchParams.set('db', countyCode)
      searchUrl.searchParams.set('ct', caseType)

      if (fromDate) {
        const from = new Date(fromDate)
        searchUrl.searchParams.set('fd', `${from.getMonth() + 1}/${from.getDate()}/${from.getFullYear()}`)
      }
      if (toDate) {
        const to = new Date(toDate)
        searchUrl.searchParams.set('td', `${to.getMonth() + 1}/${to.getDate()}/${to.getFullYear()}`)
      }

      console.log(`[OSCN] Searching: ${searchUrl.toString()}`)

      const html = await fetchWithTimeout(searchUrl.toString(), 20000)
      if (!html) continue

      const cases = parseOSCNSearchResults(html, county)
      const filteredCases = cases.filter(c =>
        c.caseType === caseType || caseTypes.includes(c.caseType)
      )
      allCases.push(...filteredCases)

    } catch (error: any) {
      console.error(`[OSCN] Error searching ${caseType}:`, error.message)
    }
  }

  // Remove duplicates
  const uniqueCases = allCases.filter((case_, index, self) =>
    index === self.findIndex(c => c.caseNumber === case_.caseNumber)
  )

  return uniqueCases
}

// Filter cases by type for specific record types
export function filterEvictionCases(cases: OSCNCase[]): OSCNCase[] {
  const evictionTypes = ['SC', 'CS', 'FD']
  const evictionKeywords = ['eviction', 'forcible', 'detainer', 'unlawful detainer', 'possession']
  
  return cases.filter(c => 
    evictionTypes.includes(c.caseType) ||
    evictionKeywords.some(kw => 
      c.caseTypeDescription.toLowerCase().includes(kw) ||
      c.plaintiff.toLowerCase().includes(kw) ||
      c.defendant.toLowerCase().includes(kw)
    )
  )
}

export function filterForeclosureCases(cases: OSCNCase[]): OSCNCase[] {
  const foreclosureTypes = ['CV', 'CJ']
  const foreclosureKeywords = ['foreclosure', 'mortgage', 'deed of trust', 'bank', 'lending']
  
  return cases.filter(c => 
    foreclosureTypes.includes(c.caseType) &&
    foreclosureKeywords.some(kw => 
      c.caseTypeDescription.toLowerCase().includes(kw) ||
      c.plaintiff.toLowerCase().includes(kw)
    )
  )
}

export function filterProbateCases(cases: OSCNCase[]): OSCNCase[] {
  const probateTypes = ['PB', 'PG']
  
  return cases.filter(c => probateTypes.includes(c.caseType))
}

export function getOSCNCounties(): string[] {
  return Object.keys(OSCN_COUNTIES)
}

export function isOSCNCounty(county: string): boolean {
  return county.toLowerCase() in OSCN_COUNTIES
}

// Fetch detailed case information from OSCN case page using cheerio
export async function fetchCaseDetails(caseLink: string): Promise<Partial<OSCNCase>> {
  try {
    console.log(`[OSCN] Fetching case details: ${caseLink}`)

    const html = await fetchWithTimeout(caseLink, 12000)
    if (!html) return {}

    const $ = cheerio.load(html)
    let plaintiff = ''
    let defendant = ''
    let filingDate = ''
    let propertyAddress = ''
    let amount = ''
    let judge = ''
    let status = 'Filed'
    const attorneys: string[] = []

    // Strategy 1: Parse party table — OSCN uses tables with "Plaintiff" / "Defendant" labels
    $('table').each((_, table) => {
      $(table).find('tr').each((_, tr) => {
        const rowText = $(tr).text()
        const cells = $(tr).find('td')
        if (cells.length >= 2) {
          const label = $(cells[0]).text().trim().toLowerCase()
          const value = $(cells[1]).text().trim()
          if (label.includes('plaintiff') && !plaintiff && value.length > 1) {
            plaintiff = value.substring(0, 120)
          }
          if (label.includes('defendant') && !defendant && value.length > 1) {
            defendant = value.substring(0, 120)
          }
        }
      })
    })

    // Strategy 2: Parse from party names with role labels
    if (!plaintiff || !defendant) {
      $('td, div, span, p').each((_, el) => {
        const text = $(el).text().trim()
        if (!plaintiff && /plaintiff/i.test(text)) {
          // Get the name — often in a sibling or child element
          const nameEl = $(el).find('a, b, strong').first()
          const name = nameEl.length ? nameEl.text().trim() : ''
          if (name.length > 1) plaintiff = name.substring(0, 120)
        }
        if (!defendant && /defendant/i.test(text)) {
          const nameEl = $(el).find('a, b, strong').first()
          const name = nameEl.length ? nameEl.text().trim() : ''
          if (name.length > 1) defendant = name.substring(0, 120)
        }
      })
    }

    // Strategy 3: Case style from title or header
    if (!plaintiff || !defendant) {
      const title = $('title').text() || ''
      const caseStyle = $('.caseStyle').text() || title
      const vsMatch = caseStyle.match(/(.+?)\s+(?:vs?\.?|versus)\s+(.+)/i)
      if (vsMatch) {
        plaintiff = plaintiff || vsMatch[1].replace(/[\s\n\r]+/g, ' ').trim().substring(0, 120)
        defendant = defendant || vsMatch[2].replace(/[\s\n\r]+/g, ' ').replace(/\s*-\s*OSCN.*$/i, '').trim().substring(0, 120)
      }
    }

    // Filing date
    $('td, div, span').each((_, el) => {
      if (filingDate) return
      const text = $(el).text().trim()
      if (/(?:filed|filing\s+date)/i.test(text)) {
        const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/)
        if (dateMatch) filingDate = dateMatch[1]
      }
    })

    // Judge
    $('td, div, span').each((_, el) => {
      if (judge) return
      const text = $(el).text().trim()
      if (/(?:judge|assigned)/i.test(text) && text.length < 200) {
        const cleaned = text.replace(/(?:judge|assigned|honorable)[:\s]*/i, '').trim()
        if (cleaned.length > 2 && cleaned.length < 80) judge = cleaned
      }
    })

    // Property address from docket entries
    const fullText = $('body').text()
    const addrPatterns = [
      /(?:Property|Subject\s+Property|Premises|Address)[:\s]*([^\n]+?(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Blvd|Way|Ct|Circle|Cir|Place|Pl)[^\n]{0,50})/i,
      /(\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Blvd|Way|Ct)[^\n,]{0,30}(?:,\s*[A-Za-z\s]+,?\s*(?:OK|Oklahoma)\s*\d{5})?)/i
    ]
    for (const pattern of addrPatterns) {
      const match = fullText.match(pattern)
      if (match) {
        propertyAddress = match[1].replace(/\s+/g, ' ').trim()
        break
      }
    }

    // Amount
    const amtMatch = fullText.match(/(?:Amount|Judgment|Principal|Claim)[:\s]*\$?([\d,]+\.?\d*)/i)
    if (amtMatch) amount = '$' + amtMatch[1]

    // Status/disposition from docket entries
    const dispositionKeywords = ['DISPOSED', 'CLOSED', 'DISMISSED', 'JUDGMENT ENTERED', 'DEFAULT JUDGMENT', 'SETTLED']
    for (const kw of dispositionKeywords) {
      if (fullText.toUpperCase().includes(kw)) {
        status = kw.charAt(0) + kw.slice(1).toLowerCase()
        break
      }
    }

    // Attorneys
    $('td, div').each((_, el) => {
      const text = $(el).text().trim()
      if (/attorney|counsel/i.test(text) && text.length < 150) {
        const name = text.replace(/(?:attorney|counsel|for\s+\w+)[:\s]*/i, '').trim()
        if (name.length > 2 && name.length < 80 && !attorneys.includes(name)) {
          attorneys.push(name)
        }
      }
    })

    return {
      plaintiff: plaintiff || undefined,
      defendant: defendant || undefined,
      filingDate: filingDate || undefined,
      propertyAddress: propertyAddress || undefined,
      amount: amount || undefined,
      judge: judge || undefined,
      status,
      attorneys: attorneys.length > 0 ? attorneys : undefined
    }

  } catch (error: any) {
    console.error(`[OSCN] Error fetching case details: ${error.message}`)
    return {}
  }
}

// Enhanced search that fetches case details for each result
export async function searchOSCNWithDetails(params: OSCNSearchParams, maxDetails: number = 25): Promise<OSCNCase[]> {
  const cases = await searchOSCN(params)

  // Only fetch details for cases that still have "See Case Details"
  const casesNeedingDetails = cases
    .filter(c => c.plaintiff === 'See Case Details' || c.defendant === 'See Case Details')
    .slice(0, maxDetails)

  if (casesNeedingDetails.length === 0) {
    console.log(`[OSCN] All ${cases.length} cases already have party info from search results`)
    return cases
  }

  console.log(`[OSCN] Fetching details for ${casesNeedingDetails.length}/${cases.length} cases...`)

  // Fetch in batches of 3 to be gentle on OSCN
  const batchSize = 3
  for (let i = 0; i < casesNeedingDetails.length; i += batchSize) {
    const batch = casesNeedingDetails.slice(i, i + batchSize)

    await Promise.all(batch.map(async (caseItem) => {
      const details = await fetchCaseDetails(caseItem.link)
      if (details.plaintiff) caseItem.plaintiff = details.plaintiff
      if (details.defendant) caseItem.defendant = details.defendant
      if (details.filingDate) caseItem.filingDate = details.filingDate
      if (details.propertyAddress) caseItem.propertyAddress = details.propertyAddress
      if (details.amount) caseItem.amount = details.amount
      if (details.judge) caseItem.judge = details.judge
      if (details.status) caseItem.status = details.status
      if (details.attorneys) caseItem.attorneys = details.attorneys
    }))

    // Delay between batches to avoid rate limiting
    if (i + batchSize < casesNeedingDetails.length) {
      await new Promise(resolve => setTimeout(resolve, 800))
    }
  }

  return cases
}
