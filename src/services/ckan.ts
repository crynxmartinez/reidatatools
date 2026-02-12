import { getCKANCityByName } from '@/config/ckan'

export interface FireCall {
  id: string
  address: string
  date: string
  type: string
  category?: string
  lat?: string
  lon?: string
  city: string
}

export interface CKANBuildingPermit {
  id: string
  address: string
  date: string
  type: string
  status: string
  city: string
  [key: string]: any
}

export interface CKANQueryParams {
  cityName: string
  fromDate?: string
  toDate?: string
  category?: string
  limit?: number
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n')
  if (lines.length < 2) return []

  // Parse header
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

// Determine which yearly resource IDs to fetch based on date range
function getResourceIdsForDateRange(
  config: { resourceId: string; yearlyResources?: Record<string, string> },
  fromDate?: string,
  toDate?: string
): string[] {
  if (!config.yearlyResources) {
    return [config.resourceId]
  }

  const fromYear = fromDate ? new Date(fromDate).getFullYear() : new Date().getFullYear()
  const toYear = toDate ? new Date(toDate).getFullYear() : new Date().getFullYear()

  const resourceIds: string[] = []
  for (let year = fromYear; year <= toYear; year++) {
    const yearStr = year.toString()
    if (config.yearlyResources[yearStr]) {
      resourceIds.push(config.yearlyResources[yearStr])
    }
  }

  // Fallback to default if no yearly match
  return resourceIds.length > 0 ? resourceIds : [config.resourceId]
}

export async function fetchFireCalls(params: CKANQueryParams): Promise<FireCall[]> {
  const city = getCKANCityByName(params.cityName)
  if (!city || !city.fireCalls) {
    throw new Error(`Fire calls data not available for ${params.cityName}`)
  }

  const config = city.fireCalls
  const limit = params.limit || 500

  // Determine which yearly CSV(s) to fetch
  const resourceIds = getResourceIdsForDateRange(config, params.fromDate, params.toDate)

  // Fetch all needed yearly CSVs and merge
  let allRows: Record<string, string>[] = []
  for (const resourceId of resourceIds) {
    const response = await fetch('/api/ckan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: city.domain,
        datasetSlug: config.datasetSlug,
        resourceId,
        type: 'csv'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error(`Failed to fetch resource ${resourceId}: ${error.error}`)
      continue
    }

    const data = await response.json()
    const rows: Record<string, string>[] = data.results || []
    allRows = allRows.concat(rows)
  }

  // Filter by date range
  let filtered = allRows
  if (params.fromDate) {
    const from = new Date(params.fromDate)
    filtered = filtered.filter(row => {
      const d = new Date(row[config.dateField])
      return !isNaN(d.getTime()) && d >= from
    })
  }
  if (params.toDate) {
    const to = new Date(params.toDate)
    to.setHours(23, 59, 59)
    filtered = filtered.filter(row => {
      const d = new Date(row[config.dateField])
      return !isNaN(d.getTime()) && d <= to
    })
  }

  // Filter by category if specified (e.g., "FIRE" for structure fires)
  if (params.category && params.category !== 'all' && config.categoryField) {
    filtered = filtered.filter(row =>
      row[config.categoryField!]?.toUpperCase().includes(params.category!.toUpperCase())
    )
  }

  // Sort by date descending
  filtered.sort((a, b) => {
    const da = new Date(a[config.dateField])
    const db = new Date(b[config.dateField])
    return db.getTime() - da.getTime()
  })

  // Limit results
  filtered = filtered.slice(0, limit)

  return filtered.map((row, index) => ({
    id: `${city.name}-fc-${index}`,
    address: row[config.addressField] || 'N/A',
    date: formatDate(row[config.dateField]),
    type: row[config.typeField] || 'N/A',
    category: config.categoryField ? row[config.categoryField] : undefined,
    lat: config.latField ? row[config.latField] : undefined,
    lon: config.lonField ? row[config.lonField] : undefined,
    city: city.name
  }))
}

export async function fetchCKANBuildingPermits(params: CKANQueryParams): Promise<CKANBuildingPermit[]> {
  const city = getCKANCityByName(params.cityName)
  if (!city || !city.buildingPermits) {
    throw new Error(`Building permits data not available for ${params.cityName}`)
  }

  const config = city.buildingPermits
  const limit = params.limit || 500

  const response = await fetch('/api/ckan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domain: city.domain,
      datasetSlug: config.datasetSlug,
      resourceId: config.resourceId,
      type: 'csv'
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to fetch building permits: ${response.status}`)
  }

  const data = await response.json()
  const rows: Record<string, string>[] = data.results || []

  // Sort by date if available
  if (config.dateField) {
    rows.sort((a, b) => {
      const da = new Date(a[config.dateField!])
      const db = new Date(b[config.dateField!])
      return db.getTime() - da.getTime()
    })
  }

  const limited = rows.slice(0, limit)

  return limited.map((row, index) => ({
    id: `${city.name}-bp-${index}`,
    address: config.addressField ? row[config.addressField] : Object.values(row)[0] || 'N/A',
    date: config.dateField ? formatDate(row[config.dateField]) : 'N/A',
    type: config.typeField ? row[config.typeField] : 'N/A',
    status: config.statusField ? row[config.statusField] : 'N/A',
    city: city.name,
    ...row
  }))
}

export async function getFireCallCategories(cityName: string): Promise<string[]> {
  const city = getCKANCityByName(cityName)
  if (!city || !city.fireCalls || !city.fireCalls.categoryField) {
    return []
  }

  try {
    const response = await fetch('/api/ckan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: city.domain,
        datasetSlug: city.fireCalls.datasetSlug,
        resourceId: city.fireCalls.resourceId,
        type: 'csv'
      })
    })

    if (!response.ok) return []

    const data = await response.json()
    const rows: Record<string, string>[] = data.results || []
    const categories = [...new Set(rows.map(r => r[city.fireCalls!.categoryField!]).filter(Boolean))].sort()
    return categories
  } catch {
    return []
  }
}
