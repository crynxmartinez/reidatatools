import axios from 'axios'
import { SocrataCity, getCityByName } from '@/config/socrata'

export interface CodeViolation {
  id: string
  address: string
  date: string
  type: string
  status: string
  description?: string
  city: string
}

export interface BuildingPermit {
  id: string
  address: string
  date: string
  type: string
  status: string
  description?: string
  contractor?: string
  cost?: string
  city: string
}

export interface SocrataQueryParams {
  cityName: string
  fromDate?: string
  toDate?: string
  type?: string
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

export async function fetchCodeViolations(params: SocrataQueryParams): Promise<CodeViolation[]> {
  const city = getCityByName(params.cityName)
  if (!city || !city.codeViolations) {
    throw new Error(`Code violations data not available for ${params.cityName}`)
  }

  const config = city.codeViolations
  const limit = params.limit || 500

  // Build SoQL query
  let whereClause = '1=1'
  
  if (params.fromDate) {
    whereClause += ` AND ${config.dateField} >= '${params.fromDate}'`
  }
  if (params.toDate) {
    whereClause += ` AND ${config.dateField} <= '${params.toDate}'`
  }
  if (params.type && params.type !== 'all') {
    whereClause += ` AND ${config.typeField} = '${params.type}'`
  }

  const url = `https://${city.domain}/resource/${config.datasetId}.json`
  
  console.log(`[Socrata] Fetching code violations from ${city.name}`)
  console.log(`[Socrata] URL: ${url}`)
  console.log(`[Socrata] Where: ${whereClause}`)

  try {
    const response = await axios.get(url, {
      params: {
        $where: whereClause,
        $limit: limit,
        $order: `${config.dateField} DESC`
      },
      timeout: 30000
    })

    const data = response.data || []
    console.log(`[Socrata] Found ${data.length} code violations`)

    return data.map((item: any, index: number) => ({
      id: item.id || `${city.name}-cv-${index}`,
      address: item[config.addressField] || 'N/A',
      date: formatDate(item[config.dateField]),
      type: item[config.typeField] || 'N/A',
      status: item[config.statusField] || 'N/A',
      description: config.descriptionField ? item[config.descriptionField] : undefined,
      city: city.name
    }))
  } catch (error: any) {
    console.error(`[Socrata] Error fetching code violations:`, error.message)
    throw new Error(`Failed to fetch code violations: ${error.message}`)
  }
}

export async function fetchBuildingPermits(params: SocrataQueryParams): Promise<BuildingPermit[]> {
  const city = getCityByName(params.cityName)
  if (!city || !city.buildingPermits) {
    throw new Error(`Building permits data not available for ${params.cityName}`)
  }

  const config = city.buildingPermits
  const limit = params.limit || 500

  // Build SoQL query
  let whereClause = '1=1'
  
  if (params.fromDate) {
    whereClause += ` AND ${config.dateField} >= '${params.fromDate}'`
  }
  if (params.toDate) {
    whereClause += ` AND ${config.dateField} <= '${params.toDate}'`
  }
  if (params.type && params.type !== 'all') {
    whereClause += ` AND ${config.typeField} = '${params.type}'`
  }

  const url = `https://${city.domain}/resource/${config.datasetId}.json`
  
  console.log(`[Socrata] Fetching building permits from ${city.name}`)
  console.log(`[Socrata] URL: ${url}`)
  console.log(`[Socrata] Where: ${whereClause}`)

  try {
    const response = await axios.get(url, {
      params: {
        $where: whereClause,
        $limit: limit,
        $order: `${config.dateField} DESC`
      },
      timeout: 30000
    })

    const data = response.data || []
    console.log(`[Socrata] Found ${data.length} building permits`)

    return data.map((item: any, index: number) => ({
      id: item.id || `${city.name}-bp-${index}`,
      address: item[config.addressField] || 'N/A',
      date: formatDate(item[config.dateField]),
      type: item[config.typeField] || 'N/A',
      status: item[config.statusField] || 'N/A',
      description: config.descriptionField ? item[config.descriptionField] : undefined,
      contractor: config.contractorField ? item[config.contractorField] : undefined,
      cost: config.costField ? item[config.costField] : undefined,
      city: city.name
    }))
  } catch (error: any) {
    console.error(`[Socrata] Error fetching building permits:`, error.message)
    throw new Error(`Failed to fetch building permits: ${error.message}`)
  }
}

export async function getViolationTypes(cityName: string): Promise<string[]> {
  const city = getCityByName(cityName)
  if (!city || !city.codeViolations) {
    return []
  }

  const config = city.codeViolations
  const url = `https://${city.domain}/resource/${config.datasetId}.json`

  try {
    const response = await axios.get(url, {
      params: {
        $select: `DISTINCT ${config.typeField}`,
        $limit: 100
      },
      timeout: 15000
    })

    const types = response.data
      .map((item: any) => item[config.typeField])
      .filter((type: string) => type && type.trim() !== '')
      .sort()

    return types
  } catch (error) {
    console.error('Error fetching violation types:', error)
    return []
  }
}

export async function getPermitTypes(cityName: string): Promise<string[]> {
  const city = getCityByName(cityName)
  if (!city || !city.buildingPermits) {
    return []
  }

  const config = city.buildingPermits
  const url = `https://${city.domain}/resource/${config.datasetId}.json`

  try {
    const response = await axios.get(url, {
      params: {
        $select: `DISTINCT ${config.typeField}`,
        $limit: 100
      },
      timeout: 15000
    })

    const types = response.data
      .map((item: any) => item[config.typeField])
      .filter((type: string) => type && type.trim() !== '')
      .sort()

    return types
  } catch (error) {
    console.error('Error fetching permit types:', error)
    return []
  }
}
