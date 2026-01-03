import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    // Extract query parameters
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      if (key !== 'url') {
        params[key] = value
      }
    })

    // Make the request server-side (no CORS issues)
    const response = await axios.get(url, {
      params,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
      }
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Proxy error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: error.response?.status || 500 }
    )
  }
}
