import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { OBITUARY_SOURCES } from '@/config/obituaries'

const SCRAPE_DO_API_KEY = process.env.SCRAPE_DO_API_KEY || ''

export interface Obituary {
  name: string
  date: string
  city: string
  state: string
  funeralHome: string
  survivedBy: string
  snippet: string
  detailUrl: string
  imageUrl?: string
  source: string
  county: string
}

async function fetchWithScrapeDo(url: string): Promise<string> {
  if (!SCRAPE_DO_API_KEY) {
    throw new Error('SCRAPE_DO_API_KEY is not configured.')
  }

  const scrapeDoUrl = `https://api.scrape.do?token=${SCRAPE_DO_API_KEY}&url=${encodeURIComponent(url)}&super=true&geoCode=us&render=true`

  console.log(`[Obituaries] Fetching: ${url}`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45000)

  try {
    const response = await fetch(scrapeDoUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'text/html' }
    })

    if (!response.ok) {
      throw new Error(`Scrape.do returned ${response.status}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

function parseLegacyObituaries(html: string, sourceId: string): Obituary[] {
  const source = OBITUARY_SOURCES.find(s => s.id === sourceId)
  if (!source) return []

  const obituaries: Obituary[] = []

  // Strategy 1: Extract from schema.org ItemList JSON (most reliable — always present)
  // Format: {"@type":"ListItem","url":"https://www.legacy.com/...","name":"John Smith","image":"..."}
  const itemListMatch = html.match(/"mainEntity"\s*:\s*\{[^}]*"itemListElement"\s*:\s*(\[[\s\S]*?\])\s*\}/)
  const schemaItems: Array<{ url: string; name: string; image?: string }> = []

  if (itemListMatch) {
    try {
      const items = JSON.parse(itemListMatch[1])
      for (const item of items) {
        if (item.url && item.name) {
          schemaItems.push({ url: item.url, name: item.name, image: item.image })
        }
      }
    } catch { /* ignore parse errors */ }
  }

  // Strategy 2: Extract from Hypernova JSON blob — has obitSnippet, location, fromToYears, mainPhoto
  // Each obit record looks like: {"name":{"fullName":"..."},"location":{"city":{"fullName":"..."}},"obitSnippet":"...","fromToYears":"...","mainPhoto":{"url":"..."}}
  const obitDataMap = new Map<string, { snippet: string; city: string; years: string; photo: string; funeralHome: string }>()

  // Extract all obitSnippet blocks from the JSON blob
  const snippetRegex = /"fullName"\s*:\s*"([^"]+)"[^}]*?"obitSnippet"\s*:\s*"([^"]*?)"/g
  let match
  while ((match = snippetRegex.exec(html)) !== null) {
    const fullName = match[1]
    const snippet = match[2].replace(/\\n/g, ' ').replace(/\\"/g, '"')
    obitDataMap.set(fullName, { snippet, city: '', years: '', photo: '', funeralHome: '' })
  }

  // Extract city info
  const cityRegex = /"fullName"\s*:\s*"([^"]+)"[\s\S]{1,300}?"city"\s*:\s*\{"fullName"\s*:\s*"?([^",}]*)"?/g
  while ((match = cityRegex.exec(html)) !== null) {
    const fullName = match[1]
    const city = match[2]?.trim() || ''
    if (obitDataMap.has(fullName) && city && city !== 'null') {
      obitDataMap.get(fullName)!.city = city
    }
  }

  // Extract fromToYears
  const yearsRegex = /"fullName"\s*:\s*"([^"]+)"[\s\S]{1,200}?"fromToYears"\s*:\s*"([^"]+)"/g
  while ((match = yearsRegex.exec(html)) !== null) {
    const fullName = match[1]
    const years = match[2]
    if (obitDataMap.has(fullName)) {
      obitDataMap.get(fullName)!.years = years
    }
  }

  // Extract mainPhoto
  const photoRegex = /"fullName"\s*:\s*"([^"]+)"[\s\S]{1,500}?"mainPhoto"\s*:\s*\{"url"\s*:\s*"([^"]+)"/g
  while ((match = photoRegex.exec(html)) !== null) {
    const fullName = match[1]
    const photo = match[2]
    if (obitDataMap.has(fullName)) {
      obitDataMap.get(fullName)!.photo = photo
    }
  }

  // Build obituaries from schema items + enrich with Hypernova data
  if (schemaItems.length > 0) {
    for (const item of schemaItems) {
      const extra = obitDataMap.get(item.name) || { snippet: '', city: '', years: '', photo: '', funeralHome: '' }

      // Extract date from years range (e.g. "1945 - 2026") or from snippet
      let date = ''
      if (extra.years) {
        const yearMatch = extra.years.match(/(\d{4})\s*$/)
        if (yearMatch) date = yearMatch[1]
      }
      const dateFromSnippet = extra.snippet.match(/(\d{2}\/\d{2}\/\d{4})/)?.[1] || ''
      if (!date && dateFromSnippet) date = dateFromSnippet

      // Extract city from snippet if not in structured data
      let city = extra.city || ''
      if (!city) {
        for (const c of source.cities) {
          if (extra.snippet.includes(c)) { city = c; break }
        }
      }

      // Extract funeral home from snippet
      const funeralMatch = extra.snippet.match(/([A-Z][^.]*(?:Funeral|Memorial|Mortuary|Chapel|Cremation)[^.]*)/)?.[1]?.trim() || ''

      // Extract survived by from snippet
      const survivedMatch = extra.snippet.match(/(?:survived by|is survived by)[^.]*\./i)?.[0] || ''

      obituaries.push({
        name: item.name,
        date,
        city,
        state: source.stateCode,
        funeralHome: funeralMatch.substring(0, 100),
        survivedBy: survivedMatch.substring(0, 300),
        snippet: extra.snippet.substring(0, 400),
        detailUrl: item.url,
        imageUrl: item.image || extra.photo || undefined,
        source: source.name,
        county: source.county
      })
    }
    return obituaries
  }

  // Fallback Strategy 3: regex all name+url pairs from the JSON blob
  const urlNameRegex = /"url"\s*:\s*"(https:\/\/www\.legacy\.com\/us\/obituaries\/[^"]+)"\s*,\s*"name"\s*:\s*"([^"]+)"/g
  while ((match = urlNameRegex.exec(html)) !== null) {
    const url = match[1]
    const name = match[2]
    if (!name || name.length < 3) continue
    if (name.toLowerCase().includes('obituar')) continue

    const extra = obitDataMap.get(name) || { snippet: '', city: '', years: '', photo: '', funeralHome: '' }
    let city = extra.city || ''
    if (!city) {
      for (const c of source.cities) {
        if (extra.snippet.includes(c)) { city = c; break }
      }
    }

    obituaries.push({
      name,
      date: extra.years?.match(/(\d{4})\s*$/)?.[1] || '',
      city,
      state: source.stateCode,
      funeralHome: '',
      survivedBy: '',
      snippet: extra.snippet.substring(0, 400),
      detailUrl: url,
      imageUrl: extra.photo || undefined,
      source: source.name,
      county: source.county
    })
  }

  // Deduplicate by URL
  const seen = new Set<string>()
  return obituaries.filter(o => {
    if (seen.has(o.detailUrl)) return false
    seen.add(o.detailUrl)
    return true
  })
}

function parseObituaryDetail(html: string): { fullText: string; survivedBy: string; funeralHome: string } {
  const $ = cheerio.load(html)

  // Legacy.com detail page selectors
  const contentSelectors = [
    '[data-component="ObituaryBody"]',
    '[class*="obituary-body"]',
    '[class*="ObituaryBody"]',
    '[class*="obit-text"]',
    '.obituary-text',
    '#obituary-text',
    'article p',
  ]

  let fullText = ''
  for (const sel of contentSelectors) {
    const text = $(sel).text().trim()
    if (text.length > 100) {
      fullText = text
      break
    }
  }

  // Fallback: largest text block
  if (!fullText) {
    let maxLen = 0
    $('p, div').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > maxLen && text.length > 200 && !text.includes('Legacy.com') && !text.includes('Sign In')) {
        maxLen = text.length
        fullText = text
      }
    })
  }

  const survivedMatch = fullText.match(/(?:survived by|is survived by)[^.]*\./i)?.[0] || ''
  const funeralMatch = fullText.match(/([A-Z][^.]*(?:Funeral|Memorial|Mortuary|Chapel|Cremation)[^.]*\.)/)?.[1]?.trim() || ''

  return {
    fullText: fullText.substring(0, 5000),
    survivedBy: survivedMatch,
    funeralHome: funeralMatch.substring(0, 150)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sourceId, keyword, city, days, action, detailUrl } = body

    if (!sourceId) {
      return NextResponse.json({ error: 'Missing sourceId' }, { status: 400 })
    }

    const source = OBITUARY_SOURCES.find(s => s.id === sourceId)
    if (!source) {
      return NextResponse.json({ error: `Unknown source: ${sourceId}` }, { status: 400 })
    }

    // Fetch detail page
    if (action === 'detail' && detailUrl) {
      const html = await fetchWithScrapeDo(detailUrl)
      const detail = parseObituaryDetail(html)
      return NextResponse.json({ success: true, ...detail })
    }

    // Build browse/search URL
    // Legacy.com supports date filtering and keyword search via URL params
    let fetchUrl = source.browseUrl

    const params = new URLSearchParams()
    if (keyword) params.set('keyword', keyword)
    if (days) {
      // Legacy.com uses page-based browsing; we'll fetch multiple pages for date range
      // The browse URL shows recent obits sorted by date
    }

    // For keyword/name search, use Legacy.com's search endpoint
    // Supports: firstName, lastName, affiliateId, dateRange
    if (keyword) {
      const words = keyword.trim().split(/\s+/)
      const searchParams = new URLSearchParams()
      searchParams.set('affiliateId', source.affiliateId || '298')
      if (words.length >= 2) {
        // Treat as "First Last" name
        searchParams.set('firstName', words[0])
        searchParams.set('lastName', words.slice(1).join(' '))
      } else {
        // Single word — try as last name first (more common in REI use case)
        searchParams.set('lastName', keyword.trim())
      }
      if (days) {
        const dateRangeMap: Record<string, string> = {
          '7': 'Last7Days', '30': 'Last30Days', '60': 'Last60Days', '90': 'Last90Days'
        }
        const dr = dateRangeMap[days]
        if (dr) searchParams.set('dateRange', dr)
      }
      fetchUrl = `https://www.legacy.com/obituaries/search?${searchParams.toString()}`
    }

    console.log(`[Obituaries] Fetching: ${fetchUrl}`)
    const html = await fetchWithScrapeDo(fetchUrl)
    let obituaries = parseLegacyObituaries(html, sourceId)

    // Filter by city if specified
    if (city && obituaries.length > 0) {
      const cityLower = city.toLowerCase()
      const filtered = obituaries.filter(o =>
        o.city.toLowerCase() === cityLower ||
        o.snippet.toLowerCase().includes(cityLower)
      )
      if (filtered.length > 0) obituaries = filtered
    }

    // Filter by keyword in name/snippet
    if (keyword && obituaries.length > 0) {
      const kw = keyword.toLowerCase()
      const filtered = obituaries.filter(o =>
        o.name.toLowerCase().includes(kw) ||
        o.snippet.toLowerCase().includes(kw) ||
        o.survivedBy.toLowerCase().includes(kw)
      )
      if (filtered.length > 0) obituaries = filtered
    }

    // Filter by days
    if (days && obituaries.length > 0) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - parseInt(days))
      const filtered = obituaries.filter(o => {
        if (!o.date) return true
        const d = new Date(o.date)
        return isNaN(d.getTime()) || d >= cutoff
      })
      if (filtered.length > 0) obituaries = filtered
    }

    return NextResponse.json({
      success: true,
      source: source.name,
      county: source.county,
      state: source.stateCode,
      count: obituaries.length,
      obituaries
    })

  } catch (error: any) {
    console.error('[Obituaries] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
