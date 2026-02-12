export interface SocrataCity {
  name: string
  state: string
  domain: string
  codeViolations?: {
    datasetId: string
    addressField: string
    dateField: string
    typeField: string
    statusField: string
    descriptionField?: string
  }
  buildingPermits?: {
    datasetId: string
    addressField: string
    dateField: string
    typeField: string
    statusField: string
    descriptionField?: string
    contractorField?: string
    costField?: string
  }
}

export const SOCRATA_CITIES: SocrataCity[] = [
  {
    name: 'Austin',
    state: 'Texas',
    domain: 'data.austintexas.gov',
    codeViolations: {
      datasetId: 'xwdj-i9he',
      addressField: 'sr_location',
      dateField: 'sr_created_date',
      typeField: 'sr_type_desc',
      statusField: 'sr_status_desc',
      descriptionField: 'sr_department_desc'
    },
    buildingPermits: {
      datasetId: '3syk-w9eu',
      addressField: 'permit_location',
      dateField: 'issue_date',
      typeField: 'permit_type_desc',
      statusField: 'status_current',
      descriptionField: 'description',
      costField: 'total_valuation',
      contractorField: 'contractor_company_name'
    }
  },
  {
    name: 'Mesa',
    state: 'Arizona',
    domain: 'data.mesaaz.gov',
    codeViolations: {
      datasetId: 'hgf6-yenu',
      addressField: 'case_address',
      dateField: 'opened_date',
      typeField: 'voilation_ordinance',
      statusField: 'status',
      descriptionField: 'description'
    }
  }
]

export function getCitiesGroupedByState(filter?: 'codeViolations' | 'buildingPermits'): Record<string, SocrataCity[]> {
  const filtered = filter 
    ? SOCRATA_CITIES.filter(c => c[filter])
    : SOCRATA_CITIES
  return filtered.reduce((groups, city) => {
    if (!groups[city.state]) groups[city.state] = []
    groups[city.state].push(city)
    return groups
  }, {} as Record<string, SocrataCity[]>)
}

export function getCityByName(name: string): SocrataCity | undefined {
  return SOCRATA_CITIES.find(city => city.name === name)
}
