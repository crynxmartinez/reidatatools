import { NextRequest, NextResponse } from 'next/server'

const SCRAPE_DO_API_KEY = process.env.SCRAPE_DO_API_KEY || '565faafc96da4e46a1377f6d10b673d04e466e10d78'

interface SkipTraceResult {
  name: string
  age?: number
  addresses: {
    street: string
    city: string
    state: string
    zip: string
    current?: boolean
  }[]
  phones: {
    number: string
    type?: string
  }[]
  emails: string[]
  relatives: string[]
  source: string
  sourceUrl: string
}

async function scrapeWithScrapeDo(targetUrl: string): Promise<string> {
  const encodedUrl = encodeURIComponent(targetUrl)
  const scrapeDoUrl = `https://api.scrape.do?token=${SCRAPE_DO_API_KEY}&url=${encodedUrl}&super=true&geoCode=us`
  
  console.log(`[SkipTrace] Scraping: ${targetUrl}`)
  
  const response = await fetch(scrapeDoUrl, {
    method: 'GET',
    headers: {
      'Accept': 'text/html'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Scrape.do returned ${response.status}: ${response.statusText}`)
  }
  
  return await response.text()
}

function extractText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractPhones(text: string): string[] {
  const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
  const matches = text.match(phoneRegex) || []
  return [...new Set(matches)]
}

function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const matches = text.match(emailRegex) || []
  return [...new Set(matches)]
}

function extractAddresses(text: string): SkipTraceResult['addresses'] {
  const addressRegex = /(\d+\s+[A-Za-z0-9\s]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane|Rd|Road|Ct|Court|Way|Pl|Place)[^,]*),\s*([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5})?/gi
  const matches = [...text.matchAll(addressRegex)]
  
  return matches.slice(0, 3).map((match, i) => ({
    street: match[1]?.trim() || '',
    city: match[2]?.trim() || '',
    state: match[3]?.trim() || '',
    zip: match[4]?.trim() || '',
    current: i === 0
  }))
}

function parseHtmlResults(html: string, searchUrl: string, source: string): SkipTraceResult[] {
  const results: SkipTraceResult[] = []
  const text = extractText(html)
  
  const namePatterns = [
    /([A-Z][a-z]+\s+(?:[A-Z]\.\s+)?[A-Z][a-z]+)(?:\s*,?\s*(?:Age|age)\s*:?\s*(\d+))?/g,
    /([A-Z][A-Z]+\s+[A-Z][A-Z]+)/g
  ]
  
  const names: { name: string; age?: number }[] = []
  
  for (const pattern of namePatterns) {
    const matches = [...text.matchAll(pattern)]
    for (const match of matches) {
      const name = match[1]?.trim()
      if (name && name.length > 3 && name.length < 50 && !name.includes('Search') && !name.includes('People')) {
        const age = match[2] ? parseInt(match[2]) : undefined
        if (!names.find(n => n.name === name)) {
          names.push({ name, age })
        }
      }
    }
    if (names.length >= 5) break
  }
  
  const phones = extractPhones(text)
  const emails = extractEmails(text)
  const addresses = extractAddresses(text)
  
  if (names.length > 0) {
    for (const { name, age } of names.slice(0, 10)) {
      results.push({
        name,
        age,
        addresses: addresses.length > 0 ? addresses : [],
        phones: phones.slice(0, 3).map(p => ({ number: p })),
        emails: emails.slice(0, 2),
        relatives: [],
        source,
        sourceUrl: searchUrl
      })
    }
  } else if (phones.length > 0 || addresses.length > 0) {
    results.push({
      name: 'Unknown',
      addresses,
      phones: phones.slice(0, 3).map(p => ({ number: p })),
      emails: emails.slice(0, 2),
      relatives: [],
      source,
      sourceUrl: searchUrl
    })
  }
  
  return results
}

function parseFastPeopleSearch(html: string, searchUrl: string): SkipTraceResult[] {
  return parseHtmlResults(html, searchUrl, 'FastPeopleSearch')
}

function parseTruePeopleSearch(html: string, searchUrl: string): SkipTraceResult[] {
  return parseHtmlResults(html, searchUrl, 'TruePeopleSearch')
}

function parseCyberBackgroundChecks(html: string, searchUrl: string): SkipTraceResult[] {
  return parseHtmlResults(html, searchUrl, 'CyberBackgroundChecks')
}

function buildSearchUrl(source: string, searchType: string, params: any): string {
  const { firstName, lastName, city, state, street, zip, phone } = params
  
  switch (source) {
    case 'fps':
      if (searchType === 'name') {
        const namePart = `${firstName}-${lastName}`.toLowerCase()
        const locationPart = city && state ? `/${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}` : ''
        return `https://www.fastpeoplesearch.com/name/${namePart}${locationPart}`
      } else if (searchType === 'address') {
        const streetPart = street.toLowerCase().replace(/\s+/g, '-')
        const cityPart = city.toLowerCase().replace(/\s+/g, '-')
        return `https://www.fastpeoplesearch.com/address/${streetPart}_${cityPart}-${state.toLowerCase()}`
      } else if (searchType === 'phone') {
        return `https://www.fastpeoplesearch.com/${phone.replace(/\D/g, '')}`
      }
      break
      
    case 'tps':
      if (searchType === 'name') {
        const namePart = `${firstName}-${lastName}`.toLowerCase()
        const locationPart = city && state ? `/${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}` : ''
        return `https://www.truepeoplesearch.com/results?name=${firstName}%20${lastName}${state ? `&citystatezip=${city || ''}%20${state}` : ''}`
      } else if (searchType === 'address') {
        return `https://www.truepeoplesearch.com/results?streetaddress=${encodeURIComponent(street)}&citystatezip=${encodeURIComponent(`${city}, ${state} ${zip || ''}`.trim())}`
      } else if (searchType === 'phone') {
        return `https://www.truepeoplesearch.com/results?phoneno=${phone.replace(/\D/g, '')}`
      }
      break
      
    case 'cbc':
      if (searchType === 'name') {
        return `https://www.cyberbackgroundchecks.com/people/${firstName}-${lastName}/${state || ''}`
      } else if (searchType === 'address') {
        return `https://www.cyberbackgroundchecks.com/address/${encodeURIComponent(street)}/${city}/${state}`
      } else if (searchType === 'phone') {
        return `https://www.cyberbackgroundchecks.com/phone/${phone.replace(/\D/g, '')}`
      }
      break
  }
  
  return ''
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchType, sources, ...searchParams } = body
    
    if (!searchType || !sources || sources.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: searchType and sources' },
        { status: 400 }
      )
    }
    
    const allResults: SkipTraceResult[] = []
    const errors: string[] = []
    
    for (const sourceId of sources) {
      try {
        const searchUrl = buildSearchUrl(sourceId, searchType, searchParams)
        
        if (!searchUrl) {
          errors.push(`Invalid search URL for ${sourceId}`)
          continue
        }
        
        console.log(`[SkipTrace] Searching ${sourceId}: ${searchUrl}`)
        
        const html = await scrapeWithScrapeDo(searchUrl)
        
        let results: SkipTraceResult[] = []
        
        switch (sourceId) {
          case 'fps':
            results = parseFastPeopleSearch(html, searchUrl)
            break
          case 'tps':
            results = parseTruePeopleSearch(html, searchUrl)
            break
          case 'cbc':
            results = parseCyberBackgroundChecks(html, searchUrl)
            break
        }
        
        console.log(`[SkipTrace] Found ${results.length} results from ${sourceId}`)
        allResults.push(...results)
        
      } catch (error: any) {
        console.error(`[SkipTrace] Error scraping ${sourceId}:`, error.message)
        errors.push(`${sourceId}: ${error.message}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      searchType,
      count: allResults.length,
      results: allResults,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error: any) {
    console.error('[SkipTrace] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
