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

export const SCRAPER_COUNTIES: ScraperCounty[] = [
  // Texas Counties - Need browser automation (Puppeteer) for real data
  {
    name: 'Dallas',
    state: 'TX',
    evictions: {
      searchUrl: 'https://www.dallascounty.org/services/record-search/',
      method: 'form',
      requiresJs: true
    },
    foreclosures: {
      searchUrl: 'https://www.dallascounty.org/services/record-search/',
      method: 'form',
      requiresJs: true
    },
    probate: {
      searchUrl: 'https://www.dallascounty.org/services/record-search/',
      method: 'form',
      requiresJs: true
    }
  },
  {
    name: 'Harris',
    state: 'TX',
    evictions: {
      searchUrl: 'https://jpwebsite.harriscountytx.gov/FindMyCase/search.jsp',
      method: 'form',
      requiresJs: true
    },
    foreclosures: {
      searchUrl: 'https://www.hcdistrictclerk.com/edocs/public/search.aspx',
      method: 'form',
      requiresJs: true
    },
    probate: {
      searchUrl: 'https://www.cclerk.hctx.net/applications/websearch/',
      method: 'form',
      requiresJs: true
    }
  },
  {
    name: 'Tarrant',
    state: 'TX',
    evictions: {
      searchUrl: 'https://www.tarrantcounty.com/en/justice-of-the-peace.html',
      method: 'form',
      requiresJs: true
    },
    foreclosures: {
      searchUrl: 'https://www.tarrantcounty.com/en/county-clerk/real-property-records.html',
      method: 'form',
      requiresJs: true
    },
    probate: {
      searchUrl: 'https://www.tarrantcounty.com/en/county-clerk/probate-records.html',
      method: 'form',
      requiresJs: true
    }
  },
  {
    name: 'Travis',
    state: 'TX',
    evictions: {
      searchUrl: 'https://odysseypa.traviscountytx.gov/JPPublicAccess/default.aspx',
      method: 'form',
      requiresJs: true
    },
    foreclosures: {
      searchUrl: 'https://countyclerk.traviscountytx.gov/records-search/',
      method: 'form',
      requiresJs: true
    },
    probate: {
      searchUrl: 'https://countyclerk.traviscountytx.gov/records-search/',
      method: 'form',
      requiresJs: true
    }
  },
  {
    name: 'Bexar',
    state: 'TX',
    evictions: {
      searchUrl: 'https://www.bexar.org/2851/Justice-of-the-Peace-Courts',
      method: 'form',
      requiresJs: true
    },
    foreclosures: {
      searchUrl: 'https://www.bexar.org/1568/County-Clerk',
      method: 'form',
      requiresJs: true
    },
    probate: {
      searchUrl: 'https://www.bexar.org/1568/County-Clerk',
      method: 'form',
      requiresJs: true
    }
  },
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
  },
  // Arizona Counties
  {
    name: 'Maricopa',
    state: 'AZ',
    evictions: {
      searchUrl: 'https://justicecourts.maricopa.gov/case-search',
      method: 'form',
      requiresJs: true,
      caseTypes: ['FED'] // Forcible Entry & Detainer
    },
    foreclosures: {
      searchUrl: 'https://recorder.maricopa.gov/recording/document-search.html',
      method: 'form',
      requiresJs: true,
      caseTypes: ['NTS'] // Notice of Trustee Sale
    },
    probate: {
      searchUrl: 'https://www.superiorcourt.maricopa.gov/docket/index.asp',
      method: 'form',
      requiresJs: true,
      caseTypes: ['PB'] // Probate
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
