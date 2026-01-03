import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const targetUrl = searchParams.get('url')
    
    if (!targetUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(targetUrl)
    
    // Extract query parameters (everything except 'url')
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      if (key !== 'url') {
        params[key] = value
      }
    })

    console.log('[Proxy] Target URL:', decodedUrl)
    console.log('[Proxy] Params:', params)

    // Make the request server-side (no CORS issues)
    const response = await axios.get(decodedUrl, {
      params,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    console.log('[Proxy] Response status:', response.status)
    
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('[Proxy] Error:', error.message)
    if (error.response) {
      console.error('[Proxy] Response status:', error.response.status)
      console.error('[Proxy] Response data:', error.response.data)
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data', details: error.response?.data },
      { status: error.response?.status || 500 }
    )
  }
}
