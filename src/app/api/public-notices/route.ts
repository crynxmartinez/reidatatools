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

function detectNoticeType(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('foreclos') || t.includes('trustee sale') || t.includes('deed of trust') || t.includes('mortgage')) return 'Foreclosure'
  if (t.includes('probate') || t.includes('estate of') || t.includes('deceased') || t.includes('letters testamentary') || t.includes('guardian')) return 'Probate'
  if (t.includes('tax sale') || t.includes('tax lien') || t.includes('delinquent tax')) return 'Tax Sale'
  if (t.includes('auction') || t.includes('public sale') || t.includes('sheriff sale')) return 'Public Sale'
  if (t.includes('ordinance')) return 'Ordinance'
  if (t.includes('bid') || t.includes('rfp') || t.includes('request for proposal')) return 'Bids'
  return 'Other'
}

function extractCounty(text: string, counties: string[]): string {
  for (const c of counties) {
    if (text.includes(c + ' County') || text.includes(c + ' county')) return c
    if (text.includes(c)) return c
  }
  return ''
}

function parseNoticeResults(html: string, siteId: string): PublicNotice[] {
  const site = PUBLIC_NOTICE_SITES.find(s => s.id === siteId)
  if (!site) return []

  const $ = cheerio.load(html)
  const notices: PublicNotice[] = []
  const baseUrl = `https://${site.domain}`

  // The usalegalnotice platform renders results inside a specific UpdatePanel/grid
  // Results are in: #ContentPlaceHolder1_WSExtendedGridNP1_GridView1 (a GridView)
  // or inside div.result-item / div.notice-row

  // Strategy 1: Target the ASP.NET GridView results table
  const $grid = $('#ctl00_ContentPlaceHolder1_WSExtendedGridNP1_GridView1, [id*="GridView1"], [id*="gvResults"], [id*="gridResults"]')
  
  if ($grid.length > 0) {
    $grid.find('tr').each((i, row) => {
      if (i === 0) return // skip header row
      const $row = $(row)
      const $link = $row.find('a[href]').first()
      const href = $link.attr('href') || ''
      const title = $link.text().trim()
      
      if (!title || title.length < 5) return
      
      const detailUrl = href.startsWith('http') ? href : `${baseUrl}/${href.replace(/^\//, '')}`
      const rowText = $row.text().trim()
      const cells = $row.find('td')
      
      const dateMatch = rowText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)?.[1] || ''
      const newspaper = cells.length > 1 ? cells.eq(cells.length - 1).text().trim() : ''
      
      notices.push({
        title: title.substring(0, 200),
        date: dateMatch,
        county: extractCounty(rowText, site.counties),
        newspaper,
        noticeType: detectNoticeType(title + ' ' + rowText),
        snippet: rowText.substring(0, 300),
        detailUrl,
        state: site.stateCode
      })
    })
  }

  // Strategy 2: Look for any links to NoticeDetail pages — these are always actual results
  if (notices.length === 0) {
    $('a[href*="NoticeDetail.aspx"]').each((_, el) => {
      const $el = $(el)
      const href = $el.attr('href') || ''
      const title = $el.text().trim()
      
      if (!title || title.length < 5) return

      const detailUrl = href.startsWith('http') ? href : `${baseUrl}/${href.replace(/^\//, '')}`
      const $row = $el.closest('tr, div.result, li')
      const rowText = $row.length ? $row.text().trim() : title
      const dateMatch = rowText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)?.[1] || ''

      notices.push({
        title: title.substring(0, 200),
        date: dateMatch,
        county: extractCounty(rowText, site.counties),
        newspaper: '',
        noticeType: detectNoticeType(title + ' ' + rowText),
        snippet: rowText.substring(0, 300),
        detailUrl,
        state: site.stateCode
      })
    })
  }

  // Strategy 3: Look for any table rows that have a link + date pattern (results grid)
  if (notices.length === 0) {
    // Find the main content area to avoid parsing nav/sidebar
    const $content = $('#ContentPlaceHolder1, #ctl00_ContentPlaceHolder1, .main-content, #mainContent').first()
    const $scope = $content.length ? $content : $('body')

    $scope.find('table tr').each((i, row) => {
      const $row = $(row)
      const $link = $row.find('a[href]').first()
      const href = $link.attr('href') || ''
      const title = $link.text().trim()

      if (!title || title.length < 10) return
      // Skip known nav links
      if (['Search Results', 'Home', 'Help', 'Back', 'Reset', 'Archive Search'].includes(title)) return
      if (title.includes('Sign In') || title.includes('Smart Search') || title.includes('About Public')) return

      const rowText = $row.text().trim()
      const dateMatch = rowText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)?.[1] || ''
      if (!dateMatch && !href.includes('Notice')) return // skip rows without a date or notice link

      const detailUrl = href.startsWith('http') ? href : (href ? `${baseUrl}/${href.replace(/^\//, '')}` : '')

      notices.push({
        title: title.substring(0, 200),
        date: dateMatch,
        county: extractCounty(rowText, site.counties),
        newspaper: '',
        noticeType: detectNoticeType(title + ' ' + rowText),
        snippet: rowText.substring(0, 300),
        detailUrl,
        state: site.stateCode
      })
    })
  }

  // Deduplicate by detailUrl or title
  const seen = new Set<string>()
  return notices.filter(n => {
    const key = n.detailUrl || n.title.toLowerCase()
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
        
        // Set search fields - usalegalnotice platform field names (confirmed from HTML inspection)
        if (keyword) {
          formData.set('ctl00$ContentPlaceHolder1$as1$txtSearch', keyword)
        }
        // hdnField: 0=All Words, 1=Any Words, 2=Exact Phrase
        formData.set('ctl00$ContentPlaceHolder1$as1$hdnField', '0')
        
        // Submit the search - button is btnGo not btnSearch
        formData.set('ctl00$ContentPlaceHolder1$as1$btnGo', '')
        
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
