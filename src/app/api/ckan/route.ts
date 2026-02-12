import { NextRequest, NextResponse } from 'next/server'

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n')
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const results: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = parseCSVLine(line)
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || ''
    })
    results.push(row)
  }

  return results
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, datasetSlug, resourceId, type } = body

    if (!domain || !datasetSlug || !resourceId) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, datasetSlug, resourceId' },
        { status: 400 }
      )
    }

    // Build the CKAN resource download URL
    const downloadUrl = `https://${domain}/dataset/${datasetSlug}/resource/${resourceId}/download`

    console.log(`[CKAN] Fetching: ${downloadUrl}`)

    const response = await fetch(downloadUrl, {
      headers: {
        'Accept': 'text/csv,application/csv,*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'follow'
    })

    if (!response.ok) {
      console.error(`[CKAN] Error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `CKAN returned ${response.status}: ${response.statusText}` },
        { status: response.status }
      )
    }

    const csvText = await response.text()
    console.log(`[CKAN] Received ${csvText.length} bytes`)

    if (type === 'csv') {
      const results = parseCSV(csvText)
      console.log(`[CKAN] Parsed ${results.length} rows`)

      return NextResponse.json({
        success: true,
        count: results.length,
        results,
        headers: results.length > 0 ? Object.keys(results[0]) : []
      })
    }

    // Return raw CSV
    return NextResponse.json({
      success: true,
      raw: csvText
    })

  } catch (error: any) {
    console.error('[CKAN] Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
