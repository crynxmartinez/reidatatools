import { ratio } from 'fuzzball'

const STREET_TYPE_MAP: Record<string, string> = {
  'AV': 'AVE',
  'AVENUE': 'AVE',
  'STREET': 'ST',
  'STR': 'ST',
  'ROAD': 'RD',
  'DRIVE': 'DR',
  'LANE': 'LN',
  'COURT': 'CT',
  'BOULEVARD': 'BLVD',
  'PLACE': 'PL',
  'CIRCLE': 'CIR',
  'TERRACE': 'TER',
  'HIGHWAY': 'HWY',
  'FREEWAY': 'FWY',
  'PARKWAY': 'PKWY',
  'WAY': 'WAY',
  'TRAIL': 'TRL',
}

export function normalizeAddress(address: string): string {
  if (!address) return ''
  
  let normalized = String(address)
    .toUpperCase()
    .replace(/,/g, ' ')
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const parts = normalized.split(' ').filter(p => p)
  
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1]
    if (STREET_TYPE_MAP[lastPart]) {
      parts[parts.length - 1] = STREET_TYPE_MAP[lastPart]
    }
  }

  return parts.join(' ')
}

export function extractHouseNumber(normalizedAddress: string): string {
  const match = normalizedAddress.match(/^(\d+)\b/)
  return match ? match[1] : ''
}

export function extractStreetToken(normalizedAddress: string): string {
  const parts = normalizedAddress.split(' ')
  if (parts.length < 2) return ''
  
  // Skip house number (first part)
  let tokenIndex = 1
  
  // Skip directional prefixes (N, S, E, W, NE, NW, SE, SW)
  const directionals = ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW', 'NORTH', 'SOUTH', 'EAST', 'WEST']
  if (tokenIndex < parts.length && directionals.includes(parts[tokenIndex])) {
    tokenIndex++
  }
  
  // Return the actual street name token
  return tokenIndex < parts.length ? parts[tokenIndex] : ''
}

export function fuzzyMatch(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  
  const normalized1 = normalizeAddress(str1)
  const normalized2 = normalizeAddress(str2)
  
  // Use ratio which returns 0-100 similarity score
  return ratio(normalized1, normalized2)
}
