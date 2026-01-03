export interface SkipTraceSource {
  name: string
  id: string
  baseUrl: string
  searchTypes: ('name' | 'address' | 'phone')[]
  enabled: boolean
}

export const SKIP_TRACE_SOURCES: SkipTraceSource[] = [
  {
    name: 'FastPeopleSearch',
    id: 'fps',
    baseUrl: 'https://www.fastpeoplesearch.com',
    searchTypes: ['name', 'address', 'phone'],
    enabled: true
  },
  {
    name: 'TruePeopleSearch',
    id: 'tps',
    baseUrl: 'https://www.truepeoplesearch.com',
    searchTypes: ['name', 'address', 'phone'],
    enabled: true
  },
  {
    name: 'CyberBackgroundChecks',
    id: 'cbc',
    baseUrl: 'https://www.cyberbackgroundchecks.com',
    searchTypes: ['name', 'address', 'phone'],
    enabled: true
  }
]

export interface SkipTraceResult {
  name: string
  age?: number
  addresses: {
    street: string
    city: string
    state: string
    zip: string
    current?: boolean
  }[]
  phones: {
    number: string
    type?: string
    carrier?: string
  }[]
  emails: string[]
  relatives: string[]
  associates: string[]
  source: string
  sourceUrl?: string
}

export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' }
]

export function getSourceById(id: string): SkipTraceSource | undefined {
  return SKIP_TRACE_SOURCES.find(source => source.id === id)
}

export function getEnabledSources(): SkipTraceSource[] {
  return SKIP_TRACE_SOURCES.filter(source => source.enabled)
}
