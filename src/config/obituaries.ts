export interface ObituarySource {
  id: string
  name: string
  state: string
  stateCode: string
  county: string
  browseUrl: string
  searchUrl: string
  platform: 'legacy' | 'dignitymemorial' | 'funeralhome'
  affiliateId?: string
  cities: string[]
}

export const OBITUARY_SOURCES: ObituarySource[] = [
  {
    id: 'harris-tx',
    name: 'Houston Chronicle Obituaries',
    state: 'Texas',
    stateCode: 'TX',
    county: 'Harris',
    browseUrl: 'https://www.legacy.com/us/obituaries/houstonchronicle/browse',
    searchUrl: 'https://www.legacy.com/us/obituaries/houstonchronicle/browse',
    platform: 'legacy',
    affiliateId: '298',
    cities: [
      'Houston', 'Pasadena', 'Baytown', 'Sugar Land', 'Pearland',
      'League City', 'Friendswood', 'Missouri City', 'Stafford', 'Humble',
      'Katy', 'Cypress', 'Spring', 'Tomball', 'Kingwood',
      'The Woodlands', 'Conroe', 'Deer Park', 'La Porte', 'Galena Park',
      'Bellaire', 'West University Place', 'Southside Place', 'Hedwig Village',
      'Bunker Hill Village', 'Piney Point Village', 'Hunters Creek Village',
      'Jersey Village', 'Atascocita', 'Channelview', 'Cloverleaf', 'Crosby'
    ]
  }
]

export const DATE_RANGE_OPTIONS = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 60 days', value: '60' },
  { label: 'Last 90 days', value: '90' },
]

export function getSourceById(id: string): ObituarySource | undefined {
  return OBITUARY_SOURCES.find(s => s.id === id)
}
