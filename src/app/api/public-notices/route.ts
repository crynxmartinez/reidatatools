import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { PUBLIC_NOTICE_SITES } from '@/config/publicNotices'

const SCRAPE_DO_API_KEY = process.env.SCRAPE_DO_API_KEY || ''

interface PublicNotice {
  title: string
  date: string
  county: string
  newspaper: string
  noticeType: string
  snippet: string
  detailUrl: string
  pdfUrl?: string
  state: string
}

async function fetchWithScrapeDo(targetUrl: string): Promise<string> {
  if (!SCRAPE_DO_API_KEY) {
    throw new Error('SCRAPE_DO_API_KEY is not configured. Please set it in your environment variables.')
  }

  const encodedUrl = encodeURIComponent(targetUrl)
  const scrapeDoUrl = `https://api.scrape.do?token=${SCRAPE_DO_API_KEY}&url=${encodedUrl}&super=true&geoCode=us`

  console.log(`[PublicNotices] Fetching: ${targetUrl}`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(scrapeDoUrl, {
      method: 'GET',
      headers: { 'Accept': 'text/html' },
      signal: controller.signal
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[PublicNotices] Scrape.do error: ${errorText}`)
      throw new Error(`Scrape.do returned ${response.status}: ${response.statusText}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

function buildSearchUrl(siteId: string, keyword: string, county?: string): string {
  const site = PUBLIC_NOTICE_SITES.find(s => s.id === siteId)
  if (!site) throw new Error(`Unknown site: ${siteId}`)

  // These sites use ASP.NET with query string search
  // The search page accepts GET params for basic searches
  const baseUrl = `https://${site.domain}`
  
  // Build search URL with keyword parameter
  // The sites support a simple keyword search via the URL
  let searchUrl = `${baseUrl}/Search.aspx`
  
  return searchUrl
}

function parseNoticeResults(html: string, siteId: string): PublicNotice[] {
  const site = PUBLIC_NOTICE_SITES.find(s => s.id === siteId)
  if (!site) return []

  const $ = cheerio.load(html)
  const notices: PublicNotice[] = []
  const baseUrl = `https://${site.domain}`

  // The usalegalnotice platform renders results in a repeating pattern
  // Look for notice entries - they typically have title links, dates, and newspaper info
  
  // Strategy 1: Look for result items with links to notice details
  $('a[href*="NoticeDetail"], a[href*="noticedetail"], a[href*="Notice"]').each((_, el) => {
    const $el = $(el)
    const title = $el.text().trim()
    const href = $el.attr('href') || ''
    
    if (!title || title.length < 5) return
    
    // Skip navigation links
    if (title === 'Search Results' || title === 'Home' || title === 'Help' || 
        title === 'Back' || title === 'Reset' || title.includes('Sign In') ||
        title.includes('Smart Search') || title.includes('About')) return

    const detailUrl = href.startsWith('http') ? href : `${baseUrl}/${href.replace(/^\//, '')}`

    // Try to find surrounding context for date, county, newspaper
    const $parent = $el.closest('tr, div, li, .notice-item, .result-item')
    const parentText = $parent.text() || ''

    // Extract date pattern
    const dateMatch = parentText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/)?.[1] || ''
    
    // Extract county - look for known county names
    let county = ''
    for (const c of site.counties) {
      if (parentText.includes(c)) {
        county = c
        break
      }
    }

    // Detect notice type from title/text
    let noticeType = 'Other'
    const lowerTitle = (title + ' ' + parentText).toLowerCase()
    if (lowerTitle.includes('foreclos')) noticeType = 'Foreclosure'
    else if (lowerTitle.includes('probate') || lowerTitle.includes('estate') || lowerTitle.includes('deceased')) noticeType = 'Probate'
    else if (lowerTitle.includes('tax sale') || lowerTitle.includes('tax lien')) noticeType = 'Tax Sale'
    else if (lowerTitle.includes('auction') || lowerTitle.includes('public sale')) noticeType = 'Public Sale'
    else if (lowerTitle.includes('trustee') || lowerTitle.includes('deed of trust')) noticeType = 'Foreclosure'
    else if (lowerTitle.includes('guardian') || lowerTitle.includes('conservator')) noticeType = 'Probate'
    else if (lowerTitle.includes('ordinance')) noticeType = 'Ordinance'
    else if (lowerTitle.includes('bid')) noticeType = 'Bids'

    notices.push({
      title: title.substring(0, 200),
      date: dateMatch,
      county,
      newspaper: '',
      noticeType,
      snippet: parentText.substring(0, 300).trim(),
      detailUrl,
      state: site.stateCode
    })
  })

  // Strategy 2: Look for table rows with notice data
  if (notices.length === 0) {
    $('table tr').each((i, row) => {
      if (i === 0) return // skip header
      const $row = $(row)
      const cells = $row.find('td')
      if (cells.length < 2) return

      const $link = $row.find('a[href]').first()
      const title = $link.text().trim() || cells.eq(0).text().trim()
      const href = $link.attr('href') || ''
      
      if (!title || title.length < 5) return

      const detailUrl = href.startsWith('http') ? href : (href ? `${baseUrl}/${href.replace(/^\//, '')}` : '')
      const rowText = $row.text()

      // Extract date
      const dateMatch = rowText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/)?.[1] || ''

      // Extract county
      let county = ''
      for (const c of site.counties) {
        if (rowText.includes(c)) {
          county = c
          break
        }
      }

      // Detect notice type
      let noticeType = 'Other'
      const lowerText = rowText.toLowerCase()
      if (lowerText.includes('foreclos')) noticeType = 'Foreclosure'
      else if (lowerText.includes('probate') || lowerText.includes('estate')) noticeType = 'Probate'
      else if (lowerText.includes('tax sale')) noticeType = 'Tax Sale'
      else if (lowerText.includes('trustee')) noticeType = 'Foreclosure'

      notices.push({
        title: title.substring(0, 200),
        date: dateMatch,
        county,
        newspaper: cells.length > 2 ? cells.eq(1).text().trim() : '',
        noticeType,
        snippet: rowText.substring(0, 300).trim(),
        detailUrl,
        state: site.stateCode
      })
    })
  }

  // Strategy 3: Look for any div/span blocks that look like results
  if (notices.length === 0) {
    // Grab all text blocks that contain notice-like content
    $('div, span, p').each((_, el) => {
      const $el = $(el)
      const text = $el.text().trim()
      
      if (text.length < 50 || text.length > 2000) return
      
      const lowerText = text.toLowerCase()
      const isNotice = lowerText.includes('foreclos') || lowerText.includes('probate') || 
                       lowerText.includes('tax sale') || lowerText.includes('trustee') ||
                       lowerText.includes('estate of') || lowerText.includes('notice of sale')
      
      if (!isNotice) return

      const $link = $el.find('a[href]').first()
      const href = $link.attr('href') || ''
      const detailUrl = href.startsWith('http') ? href : (href ? `${baseUrl}/${href.replace(/^\//, '')}` : '')

      let noticeType = 'Other'
      if (lowerText.includes('foreclos') || lowerText.includes('trustee')) noticeType = 'Foreclosure'
      else if (lowerText.includes('probate') || lowerText.includes('estate')) noticeType = 'Probate'
      else if (lowerText.includes('tax sale')) noticeType = 'Tax Sale'

      const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/)?.[1] || ''

      let county = ''
      for (const c of site.counties) {
        if (text.includes(c)) {
          county = c
          break
        }
      }

      notices.push({
        title: text.substring(0, 100),
        date: dateMatch,
        county,
        newspaper: '',
        noticeType,
        snippet: text.substring(0, 300),
        detailUrl,
        state: site.stateCode
      })
    })
  }

  // Deduplicate by title
  const seen = new Set<string>()
  return notices.filter(n => {
    const key = n.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function parseNoticeDetail(html: string, siteId: string): { content: string; pdfUrl?: string } {
  const site = PUBLIC_NOTICE_SITES.find(s => s.id === siteId)
  if (!site) return { content: '' }

  const $ = cheerio.load(html)
  const baseUrl = `https://${site.domain}`

  // Find PDF link
  let pdfUrl: string | undefined
  $('a[href*=".pdf"], a[href*="PDF"], a[href*="download"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (href.toLowerCase().includes('.pdf') || href.toLowerCase().includes('download')) {
      pdfUrl = href.startsWith('http') ? href : `${baseUrl}/${href.replace(/^\//, '')}`
    }
  })

  // Also check for embedded PDF viewers or iframes
  $('iframe[src*=".pdf"], embed[src*=".pdf"], object[data*=".pdf"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data') || ''
    if (src) {
      pdfUrl = src.startsWith('http') ? src : `${baseUrl}/${src.replace(/^\//, '')}`
    }
  })

  // Extract the notice content text
  let content = ''
  // Look for the main content area
  const contentSelectors = [
    '#ContentPlaceHolder1_lblContent',
    '#ContentPlaceHolder1_pnlNotice',
    '.notice-content',
    '.notice-detail',
    '#notice-text',
    '.content-area'
  ]

  for (const selector of contentSelectors) {
    const $content = $(selector)
    if ($content.length > 0) {
      content = $content.text().trim()
      // Also check for PDF links within this content area
      $content.find('a[href*=".pdf"]').each((_, el) => {
        const href = $(el).attr('href') || ''
        if (href) {
          pdfUrl = href.startsWith('http') ? href : `${baseUrl}/${href.replace(/^\//, '')}`
        }
      })
      break
    }
  }

  // Fallback: get the largest text block on the page
  if (!content) {
    let maxLen = 0
    $('div, td, p').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > maxLen && text.length > 100) {
        // Skip navigation/header text
        if (!text.includes('Smart Search') && !text.includes('About Public Notices')) {
          maxLen = text.length
          content = text
        }
      }
    })
  }

  return { content: content.substring(0, 5000), pdfUrl }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siteId, keyword, county, noticeType, action, detailUrl } = body

    if (!siteId) {
      return NextResponse.json({ error: 'Missing siteId' }, { status: 400 })
    }

    const site = PUBLIC_NOTICE_SITES.find(s => s.id === siteId)
    if (!site) {
      return NextResponse.json({ error: `Unknown site: ${siteId}` }, { status: 400 })
    }

    // Action: fetch detail page for a specific notice
    if (action === 'detail' && detailUrl) {
      console.log(`[PublicNotices] Fetching detail: ${detailUrl}`)
      const html = await fetchWithScrapeDo(detailUrl)
      const detail = parseNoticeDetail(html, siteId)
      return NextResponse.json({ success: true, ...detail })
    }

    // Action: search for notices
    if (!keyword && !county) {
      return NextResponse.json({ error: 'Please provide a keyword or county to search' }, { status: 400 })
    }

    // Build the search URL
    // These ASP.NET sites accept keyword search via URL params
    const baseUrl = `https://${site.domain}`
    
    // First, fetch the search page to get any session/viewstate tokens
    // Then we'll try a simple keyword-based URL approach
    let searchUrl = `${baseUrl}/Search.aspx`
    
    // Try the simple search approach - append keyword to URL
    // Many of these sites support: /Search.aspx?keyword=foreclosure&county=Madison
    const params = new URLSearchParams()
    if (keyword) params.set('keyword', keyword)
    
    // For the initial approach, we'll fetch the search page and look for results
    // If the site requires POST, we'll need to handle ViewState
    console.log(`[PublicNotices] Searching ${site.name}: keyword="${keyword}", county="${county}"`)
    
    // Fetch the search page
    const html = await fetchWithScrapeDo(searchUrl)
    
    // Check if we got a page with a search form (need to submit it)
    // or if results are already present
    let notices = parseNoticeResults(html, siteId)
    
    // If no results found from the initial page, try to submit the search form
    // by constructing a POST request with the form data
    if (notices.length === 0) {
      const $ = cheerio.load(html)
      
      // Extract ASP.NET form fields
      const viewState = $('input[name="__VIEWSTATE"]').val() as string || ''
      const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val() as string || ''
      const eventValidation = $('input[name="__EVENTVALIDATION"]').val() as string || ''
      
      if (viewState) {
        console.log(`[PublicNotices] Found ASP.NET form, submitting search...`)
        
        // Build form data for POST
        const formData = new URLSearchParams()
        formData.set('__VIEWSTATE', viewState)
        if (viewStateGenerator) formData.set('__VIEWSTATEGENERATOR', viewStateGenerator)
        if (eventValidation) formData.set('__EVENTVALIDATION', eventValidation)
        
        // Set search fields - common field names for usalegalnotice platform
        if (keyword) {
          formData.set('ctl00$ContentPlaceHolder1$as1$txtSearch', keyword)
        }
        
        // Submit the search
        formData.set('ctl00$ContentPlaceHolder1$as1$btnSearch', 'Search')
        
        // Use Scrape.do with POST
        const postUrl = `https://api.scrape.do?token=${SCRAPE_DO_API_KEY}&url=${encodeURIComponent(searchUrl)}&super=true&geoCode=us`
        
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000)
        
        try {
          const postResponse = await fetch(postUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
            signal: controller.signal
          })
          
          if (postResponse.ok) {
            const postHtml = await postResponse.text()
            notices = parseNoticeResults(postHtml, siteId)
          }
        } finally {
          clearTimeout(timeout)
        }
      }
    }

    // Filter by county if specified
    if (county && notices.length > 0) {
      const countyLower = county.toLowerCase()
      const filtered = notices.filter(n => 
        n.county.toLowerCase() === countyLower || 
        n.snippet.toLowerCase().includes(countyLower)
      )
      if (filtered.length > 0) notices = filtered
    }

    // Filter by notice type if specified
    if (noticeType && noticeType !== 'all' && notices.length > 0) {
      notices = notices.filter(n => n.noticeType === noticeType)
    }

    return NextResponse.json({
      success: true,
      site: site.name,
      state: site.stateCode,
      count: notices.length,
      notices
    })

  } catch (error: any) {
    console.error('[PublicNotices] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
