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
