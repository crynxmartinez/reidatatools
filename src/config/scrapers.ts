export interface ScraperCounty {
  name: string
  state: string
  oscnCode?: string // Oklahoma OSCN county code
  evictions?: {
    searchUrl: string
    method: 'form' | 'api' | 'static' | 'oscn'
    requiresJs: boolean
    caseTypes?: string[] // OSCN case type codes
    selectors?: {
      resultsTable?: string
      address?: string
      plaintiff?: string
      defendant?: string
      caseNumber?: string
      filingDate?: string
      status?: string
    }
  }
  foreclosures?: {
    searchUrl: string
    method: 'form' | 'api' | 'static' | 'oscn'
    requiresJs: boolean
    caseTypes?: string[]
  }
  probate?: {
    searchUrl: string
    method: 'form' | 'api' | 'static' | 'oscn'
    requiresJs: boolean
    caseTypes?: string[]
  }
}

// Only counties with real data sources (no demo/placeholder data)
export const SCRAPER_COUNTIES: ScraperCounty[] = [
  // Oklahoma Counties - Using OSCN (Oklahoma State Courts Network) - FREE real data
  {
    name: 'Oklahoma',
    state: 'OK',
    oscnCode: 'oklahoma',
    evictions: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['SC', 'CS'] // Small Claims, Civil - includes FED (Forcible Entry & Detainer)
    },
    foreclosures: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['CV', 'CJ'] // Civil cases
    },
    probate: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['PB', 'PG'] // Probate, Guardianship
    }
  },
  {
    name: 'Tulsa',
    state: 'OK',
    oscnCode: 'tulsa',
    evictions: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['SC', 'CS']
    },
    foreclosures: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['CV', 'CJ']
    },
    probate: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['PB', 'PG']
    }
  },
  {
    name: 'Cleveland',
    state: 'OK',
    oscnCode: 'cleveland',
    evictions: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['SC', 'CS']
    },
    foreclosures: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['CV', 'CJ']
    },
    probate: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['PB', 'PG']
    }
  },
  {
    name: 'Canadian',
    state: 'OK',
    oscnCode: 'canadian',
    evictions: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['SC', 'CS']
    },
    foreclosures: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['CV', 'CJ']
    },
    probate: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['PB', 'PG']
    }
  },
  {
    name: 'Comanche',
    state: 'OK',
    oscnCode: 'comanche',
    evictions: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['SC', 'CS']
    },
    foreclosures: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['CV', 'CJ']
    },
    probate: {
      searchUrl: 'https://www.oscn.net/dockets/Results.aspx',
      method: 'oscn',
      requiresJs: false,
      caseTypes: ['PB', 'PG']
    }
  }
]

export function getCountyByName(name: string): ScraperCounty | undefined {
  return SCRAPER_COUNTIES.find(county => county.name === name)
}

export function getCountiesWithEvictions(): ScraperCounty[] {
  return SCRAPER_COUNTIES.filter(county => county.evictions)
}

export function getCountiesWithForeclosures(): ScraperCounty[] {
  return SCRAPER_COUNTIES.filter(county => county.foreclosures)
}

export function getCountiesWithProbate(): ScraperCounty[] {
  return SCRAPER_COUNTIES.filter(county => county.probate)
}
