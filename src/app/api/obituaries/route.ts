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

  const $ = cheerio.load(html)
  const obituaries: Obituary[] = []

  // Legacy.com renders obit cards — each card has name, date, city, funeral home
  // Selectors based on Legacy.com's React-rendered HTML structure

  // Strategy 1: data-component or article cards
  const cardSelectors = [
    '[data-component="ObituaryCard"]',
    'article',
    '.obituary-listing',
    '.obit-listing',
    '[class*="ObituaryCard"]',
    '[class*="obituary-card"]',
    '[class*="obit-card"]',
  ]

  let foundCards = false

  for (const selector of cardSelectors) {
    const $cards = $(selector)
    if ($cards.length > 2) {
      $cards.each((_, card) => {
        const $card = $(card)
        const $link = $card.find('a[href*="/obituaries/"]').first()
        const href = $link.attr('href') || ''
        const name = $card.find('h2, h3, [class*="name"], [class*="Name"]').first().text().trim()
          || $link.text().trim()

        if (!name || name.length < 3) return

        const detailUrl = href.startsWith('http') ? href : `https://www.legacy.com${href}`
        const cardText = $card.text().trim()

        // Extract date
        const dateMatch = cardText.match(/(\w+ \d{1,2},?\s*\d{4})/)?.[1]
          || cardText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)?.[1]
          || ''

        // Extract city
        let city = ''
        for (const c of source.cities) {
          if (cardText.includes(c)) { city = c; break }
        }

        // Extract funeral home
        const funeralMatch = cardText.match(/([A-Z][^.]*(?:Funeral|Memorial|Mortuary|Chapel|Cremation)[^.]*)/)?.[1]?.trim() || ''

        // Extract survived by
        const survivedMatch = cardText.match(/survived by[^.]*\./i)?.[0]
          || cardText.match(/is survived by[^.]*\./i)?.[0]
          || ''

        // Image
        const imgSrc = $card.find('img').attr('src') || ''

        obituaries.push({
          name,
          date: dateMatch,
          city,
          state: source.stateCode,
          funeralHome: funeralMatch.substring(0, 100),
          survivedBy: survivedMatch.substring(0, 200),
          snippet: cardText.substring(0, 400).replace(/\s+/g, ' ').trim(),
          detailUrl,
          imageUrl: imgSrc || undefined,
          source: source.name,
          county: source.county
        })
      })

      if (obituaries.length > 0) {
        foundCards = true
        break
      }
    }
  }

  // Strategy 2: Find all links to /obituaries/ detail pages
  if (!foundCards) {
    $('a[href*="/obituaries/"]').each((_, el) => {
      const $el = $(el)
      const href = $el.attr('href') || ''
      const name = $el.text().trim()

      // Skip nav/category links
      if (!name || name.length < 3) return
      if (href.includes('/local/') || href.includes('/browse') || href.includes('/search')) return
      if (name.toLowerCase().includes('obituar') || name.toLowerCase().includes('browse')) return

      const detailUrl = href.startsWith('http') ? href : `https://www.legacy.com${href}`
      const $parent = $el.closest('li, div, article, section')
      const parentText = $parent.text().trim()

      const dateMatch = parentText.match(/(\w+ \d{1,2},?\s*\d{4})/)?.[1] || ''

      let city = ''
      for (const c of source.cities) {
        if (parentText.includes(c)) { city = c; break }
      }

      obituaries.push({
        name,
        date: dateMatch,
        city,
        state: source.stateCode,
        funeralHome: '',
        survivedBy: '',
        snippet: parentText.substring(0, 300).replace(/\s+/g, ' ').trim(),
        detailUrl,
        source: source.name,
        county: source.county
      })
    })
  }

  // Deduplicate by name + date
  const seen = new Set<string>()
  return obituaries.filter(o => {
    const key = `${o.name}|${o.date}`
    if (seen.has(key)) return false
    seen.add(key)
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

    // For keyword search, use the search URL
    if (keyword) {
      fetchUrl = `https://www.legacy.com/us/obituaries/houstonchronicle/browse?keyword=${encodeURIComponent(keyword)}`
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
