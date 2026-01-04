// OSCN (Oklahoma State Courts Network) Service
// Fetches court records from Oklahoma's free public court database

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
  // Additional details from case page
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

// OSCN county codes mapping
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

// Case type descriptions
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

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseOSCNResults(html: string, county: string): OSCNCase[] {
  const cases: OSCNCase[] = []
  
  // OSCN returns results in a table format
  // Look for case links pattern: GetCaseInformation.aspx?db=county&number=XX-XXXX
  const casePattern = /GetCaseInformation\.aspx\?db=([^&]+)&(?:amp;)?number=([^"&]+)/gi
  const matches = [...html.matchAll(casePattern)]
  
  // Also try to extract from table rows
  const rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gi
  const rows = html.match(rowPattern) || []
  
  const seenCases = new Set<string>()
  
  for (const match of matches) {
    const db = match[1]
    const caseNumber = decodeURIComponent(match[2])
    
    if (seenCases.has(caseNumber)) continue
    seenCases.add(caseNumber)
    
    // Try to find more info about this case from surrounding context
    const caseIndex = match.index || 0
    const contextStart = Math.max(0, caseIndex - 500)
    const contextEnd = Math.min(html.length, caseIndex + 500)
    const context = html.substring(contextStart, contextEnd)
    
    // Extract date pattern (MM/DD/YYYY or MM-DD-YYYY)
    const dateMatch = context.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
    const filingDate = dateMatch ? dateMatch[1] : ''
    
    // Extract case type from case number (e.g., SC-2024-123 -> SC)
    const typeMatch = caseNumber.match(/^([A-Z]{2})/i)
    const caseType = typeMatch ? typeMatch[1].toUpperCase() : ''
    
    // Try to extract party names from context
    const partyMatch = context.match(/(?:vs?\.?|versus)\s*([^<\n]+)/i)
    let plaintiff = ''
    let defendant = ''
    
    if (partyMatch) {
      const parties = partyMatch[1].split(/\s+vs?\.?\s+/i)
      if (parties.length >= 2) {
        plaintiff = parties[0].trim().substring(0, 100)
        defendant = parties[1].trim().substring(0, 100)
      }
    }
    
    // Extract status if available
    const statusMatch = context.match(/(?:status|disposition)[:\s]*([^<\n]+)/i)
    const status = statusMatch ? statusMatch[1].trim().substring(0, 50) : 'Filed'
    
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
  }
  
  return cases
}

export async function searchOSCN(params: OSCNSearchParams): Promise<OSCNCase[]> {
  const { county, caseTypes, fromDate, toDate } = params
  
  const countyCode = OSCN_COUNTIES[county.toLowerCase()]
  if (!countyCode) {
    throw new Error(`Unknown OSCN county: ${county}`)
  }
  
  const allCases: OSCNCase[] = []
  
  // Search for each case type
  for (const caseType of caseTypes) {
    try {
      // Build OSCN search URL
      // OSCN uses a form-based search, we'll construct the results URL
      const searchUrl = new URL('https://www.oscn.net/dockets/Results.aspx')
      searchUrl.searchParams.set('db', countyCode)
      searchUrl.searchParams.set('ct', caseType)
      
      // Add date filters if provided
      if (fromDate) {
        const from = new Date(fromDate)
        searchUrl.searchParams.set('fd', `${from.getMonth() + 1}/${from.getDate()}/${from.getFullYear()}`)
      }
      if (toDate) {
        const to = new Date(toDate)
        searchUrl.searchParams.set('td', `${to.getMonth() + 1}/${to.getDate()}/${to.getFullYear()}`)
      }
      
      console.log(`[OSCN] Searching: ${searchUrl.toString()}`)
      
      const response = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      if (!response.ok) {
        console.error(`[OSCN] Error fetching ${caseType}: ${response.status}`)
        continue
      }
      
      const html = await response.text()
      const cases = parseOSCNResults(html, county)
      
      // Filter by case type
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

// Fetch detailed case information from OSCN case page
export async function fetchCaseDetails(caseLink: string): Promise<Partial<OSCNCase>> {
  try {
    console.log(`[OSCN] Fetching case details: ${caseLink}`)
    
    const response = await fetch(caseLink, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      console.error(`[OSCN] Error fetching case: ${response.status}`)
      return {}
    }
    
    const html = await response.text()
    
    // Extract parties (plaintiff/defendant)
    let plaintiff = ''
    let defendant = ''
    
    // Look for party section - OSCN uses tables with party info
    const partyMatch = html.match(/Party\s+Name[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i)
    if (partyMatch) {
      const partyTable = partyMatch[1]
      // Extract plaintiff (usually first party or marked as Plaintiff)
      const plaintiffMatch = partyTable.match(/Plaintiff[^<]*<[^>]*>([^<]+)/i) || 
                            partyTable.match(/<td[^>]*>([^<]+)<\/td>/i)
      if (plaintiffMatch) plaintiff = plaintiffMatch[1].trim()
      
      // Extract defendant
      const defendantMatch = partyTable.match(/Defendant[^<]*<[^>]*>([^<]+)/i)
      if (defendantMatch) defendant = defendantMatch[1].trim()
    }
    
    // Alternative party extraction from case style
    if (!plaintiff || !defendant) {
      const styleMatch = html.match(/(?:Case\s+Style|Style)[:\s]*([^<]+)\s+(?:vs?\.?|versus)\s+([^<]+)/i)
      if (styleMatch) {
        plaintiff = plaintiff || styleMatch[1].trim()
        defendant = defendant || styleMatch[2].trim()
      }
    }
    
    // Extract filing date
    let filingDate = ''
    const dateMatch = html.match(/(?:Filed|Filing\s+Date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
    if (dateMatch) filingDate = dateMatch[1]
    
    // Extract property address - look for address patterns in the case
    let propertyAddress = ''
    const addressPatterns = [
      /(?:Property|Real\s+Property|Subject\s+Property|Address)[:\s]*([^<\n]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct)[^<\n]*)/i,
      /(\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct)[^<,\n]*(?:,\s*[A-Za-z\s]+,?\s*(?:OK|Oklahoma)\s*\d{5})?)/i
    ]
    for (const pattern of addressPatterns) {
      const match = html.match(pattern)
      if (match) {
        propertyAddress = match[1].trim().replace(/\s+/g, ' ')
        break
      }
    }
    
    // Extract amount/judgment amount
    let amount = ''
    const amountPatterns = [
      /(?:Amount|Judgment|Principal|Claim)[:\s]*\$?([\d,]+\.?\d*)/i,
      /\$([\d,]+\.?\d*)/
    ]
    for (const pattern of amountPatterns) {
      const match = html.match(pattern)
      if (match) {
        amount = '$' + match[1]
        break
      }
    }
    
    // Extract judge
    let judge = ''
    const judgeMatch = html.match(/(?:Judge|Assigned\s+Judge)[:\s]*([^<\n]+)/i)
    if (judgeMatch) judge = judgeMatch[1].trim()
    
    // Extract status/disposition
    let status = 'Filed'
    const statusPatterns = [
      /(?:Disposition|Status|Case\s+Status)[:\s]*([^<\n]+)/i,
      /(?:DISPOSED|CLOSED|DISMISSED|JUDGMENT)/i
    ]
    for (const pattern of statusPatterns) {
      const match = html.match(pattern)
      if (match) {
        status = match[1] ? match[1].trim() : match[0].trim()
        break
      }
    }
    
    // Extract attorneys
    const attorneys: string[] = []
    const attorneyMatches = html.matchAll(/(?:Attorney|Counsel)[:\s]*([^<\n]+)/gi)
    for (const match of attorneyMatches) {
      const attorney = match[1].trim()
      if (attorney && !attorneys.includes(attorney)) {
        attorneys.push(attorney)
      }
    }
    
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

// Enhanced search that fetches case details
export async function searchOSCNWithDetails(params: OSCNSearchParams, maxDetails: number = 25): Promise<OSCNCase[]> {
  // First get basic search results
  const cases = await searchOSCN(params)
  
  // Then fetch details for each case (limited to avoid too many requests)
  const casesToFetch = cases.slice(0, maxDetails)
  
  console.log(`[OSCN] Fetching details for ${casesToFetch.length} cases...`)
  
  // Fetch details in batches to avoid overwhelming the server
  const batchSize = 5
  for (let i = 0; i < casesToFetch.length; i += batchSize) {
    const batch = casesToFetch.slice(i, i + batchSize)
    
    await Promise.all(batch.map(async (caseItem) => {
      const details = await fetchCaseDetails(caseItem.link)
      
      // Merge details into case
      if (details.plaintiff) caseItem.plaintiff = details.plaintiff
      if (details.defendant) caseItem.defendant = details.defendant
      if (details.filingDate) caseItem.filingDate = details.filingDate
      if (details.propertyAddress) caseItem.propertyAddress = details.propertyAddress
      if (details.amount) caseItem.amount = details.amount
      if (details.judge) caseItem.judge = details.judge
      if (details.status) caseItem.status = details.status
      if (details.attorneys) caseItem.attorneys = details.attorneys
    }))
    
    // Small delay between batches
    if (i + batchSize < casesToFetch.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return cases
}
