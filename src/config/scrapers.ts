export interface ScraperCounty {
  name: string
  state: string
  evictions?: {
    searchUrl: string
    method: 'form' | 'api' | 'static'
    requiresJs: boolean
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
    method: 'form' | 'api' | 'static'
    requiresJs: boolean
  }
  probate?: {
    searchUrl: string
    method: 'form' | 'api' | 'static'
    requiresJs: boolean
  }
}

export const SCRAPER_COUNTIES: ScraperCounty[] = [
  {
    name: 'Dallas',
    state: 'TX',
    evictions: {
      searchUrl: 'https://www.dallascounty.org/services/record-search/',
      method: 'form',
      requiresJs: true,
      selectors: {
        resultsTable: 'table.results',
        address: 'td.address',
        plaintiff: 'td.plaintiff',
        defendant: 'td.defendant',
        caseNumber: 'td.case-number',
        filingDate: 'td.filing-date',
        status: 'td.status'
      }
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
      requiresJs: true,
      selectors: {
        resultsTable: '#searchResults',
        caseNumber: '.caseNumber',
        filingDate: '.filedDate',
        status: '.status'
      }
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
