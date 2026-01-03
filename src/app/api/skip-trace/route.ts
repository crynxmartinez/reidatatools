import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

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

function parseFastPeopleSearch(html: string, searchUrl: string): SkipTraceResult[] {
  const $ = cheerio.load(html)
  const results: SkipTraceResult[] = []
  
  $('.card.card-block.card-summary').each((_, card) => {
    try {
      const nameEl = $(card).find('.card-title a, h2.card-title')
      const name = nameEl.text().trim()
      
      if (!name) return
      
      const ageMatch = $(card).find('.card-title').text().match(/Age\s*(\d+)/i)
      const age = ageMatch ? parseInt(ageMatch[1]) : undefined
      
      const addresses: SkipTraceResult['addresses'] = []
      $(card).find('.detail-box-address, .address-current, .link-to-more').each((i, addrEl) => {
        const addrText = $(addrEl).text().trim()
        const parts = addrText.split(',').map(p => p.trim())
        if (parts.length >= 2) {
          const stateZip = parts[parts.length - 1].split(' ')
          addresses.push({
            street: parts[0] || '',
            city: parts.length > 2 ? parts[1] : '',
            state: stateZip[0] || '',
            zip: stateZip[1] || '',
            current: i === 0
          })
        }
      })
      
      const phones: SkipTraceResult['phones'] = []
      $(card).find('.detail-box-phone a, a[href^="tel:"]').each((_, phoneEl) => {
        const phone = $(phoneEl).text().trim().replace(/[^\d-().\s]/g, '')
        if (phone && phone.length >= 10) {
          phones.push({ number: phone })
        }
      })
      
      const relatives: string[] = []
      $(card).find('.rel-item a, .detail-box-relatives a').each((_, relEl) => {
        const rel = $(relEl).text().trim()
        if (rel) relatives.push(rel)
      })
      
      if (name) {
        results.push({
          name,
          age,
          addresses,
          phones,
          emails: [],
          relatives,
          source: 'FastPeopleSearch',
          sourceUrl: searchUrl
        })
      }
    } catch (e) {
      console.error('[SkipTrace] Error parsing FPS card:', e)
    }
  })
  
  return results
}

function parseTruePeopleSearch(html: string, searchUrl: string): SkipTraceResult[] {
  const $ = cheerio.load(html)
  const results: SkipTraceResult[] = []
  
  $('[data-detail-link], .card-summary, .people-list .card').each((_, card) => {
    try {
      const nameEl = $(card).find('.card-title a, h2 a, .name')
      const name = nameEl.first().text().trim()
      
      if (!name) return
      
      const ageText = $(card).text()
      const ageMatch = ageText.match(/Age\s*(\d+)/i) || ageText.match(/(\d+)\s*years?\s*old/i)
      const age = ageMatch ? parseInt(ageMatch[1]) : undefined
      
      const addresses: SkipTraceResult['addresses'] = []
      $(card).find('.address, .location, [class*="address"]').each((i, addrEl) => {
        const addrText = $(addrEl).text().trim()
        if (addrText.includes(',')) {
          const parts = addrText.split(',').map(p => p.trim())
          const stateZip = (parts[parts.length - 1] || '').split(' ')
          addresses.push({
            street: parts[0] || '',
            city: parts.length > 2 ? parts[1] : '',
            state: stateZip[0] || '',
            zip: stateZip[1] || '',
            current: i === 0
          })
        }
      })
      
      const phones: SkipTraceResult['phones'] = []
      $(card).find('a[href^="tel:"], .phone, [class*="phone"]').each((_, phoneEl) => {
        const phone = $(phoneEl).text().trim().replace(/[^\d-().\s]/g, '')
        if (phone && phone.length >= 10) {
          phones.push({ number: phone })
        }
      })
      
      const emails: string[] = []
      $(card).find('a[href^="mailto:"], .email').each((_, emailEl) => {
        const email = $(emailEl).text().trim()
        if (email && email.includes('@')) {
          emails.push(email)
        }
      })
      
      const relatives: string[] = []
      $(card).find('.relative a, .relatives a, [class*="relative"] a').each((_, relEl) => {
        const rel = $(relEl).text().trim()
        if (rel) relatives.push(rel)
      })
      
      if (name) {
        results.push({
          name,
          age,
          addresses,
          phones,
          emails,
          relatives,
          source: 'TruePeopleSearch',
          sourceUrl: searchUrl
        })
      }
    } catch (e) {
      console.error('[SkipTrace] Error parsing TPS card:', e)
    }
  })
  
  return results
}

function parseCyberBackgroundChecks(html: string, searchUrl: string): SkipTraceResult[] {
  const $ = cheerio.load(html)
  const results: SkipTraceResult[] = []
  
  $('.card, .person-card, .result-card, [class*="person"]').each((_, card) => {
    try {
      const nameEl = $(card).find('h2, h3, .name, .person-name')
      const name = nameEl.first().text().trim()
      
      if (!name) return
      
      const ageMatch = $(card).text().match(/Age[:\s]*(\d+)/i)
      const age = ageMatch ? parseInt(ageMatch[1]) : undefined
      
      const addresses: SkipTraceResult['addresses'] = []
      $(card).find('.address, [class*="address"]').each((i, addrEl) => {
        const addrText = $(addrEl).text().trim()
        if (addrText.includes(',')) {
          const parts = addrText.split(',').map(p => p.trim())
          const stateZip = (parts[parts.length - 1] || '').split(' ')
          addresses.push({
            street: parts[0] || '',
            city: parts.length > 2 ? parts[1] : '',
            state: stateZip[0] || '',
            zip: stateZip[1] || '',
            current: i === 0
          })
        }
      })
      
      const phones: SkipTraceResult['phones'] = []
      $(card).find('a[href^="tel:"], .phone, [class*="phone"]').each((_, phoneEl) => {
        const phone = $(phoneEl).text().trim().replace(/[^\d-().\s]/g, '')
        if (phone && phone.length >= 10) {
          phones.push({ number: phone })
        }
      })
      
      if (name) {
        results.push({
          name,
          age,
          addresses,
          phones,
          emails: [],
          relatives: [],
          source: 'CyberBackgroundChecks',
          sourceUrl: searchUrl
        })
      }
    } catch (e) {
      console.error('[SkipTrace] Error parsing CBC card:', e)
    }
  })
  
  return results
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
