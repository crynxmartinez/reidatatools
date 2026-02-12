export interface CKANDataset {
  name: string
  state: string
  domain: string
  fireCalls?: {
    datasetSlug: string
    resourceId: string
    addressField: string
    dateField: string
    typeField: string
    categoryField?: string
    latField?: string
    lonField?: string
  }
  buildingPermits?: {
    datasetSlug: string
    resourceId: string
    addressField?: string
    dateField?: string
    typeField?: string
    statusField?: string
  }
  codeViolations?: {
    datasetSlug: string
    resourceId: string
    addressField: string
    dateField: string
    typeField: string
    statusField: string
    descriptionField?: string
  }
}

export const CKAN_CITIES: CKANDataset[] = [
  {
    name: 'Phoenix',
    state: 'Arizona',
    domain: 'www.phoenixopendata.com',
    fireCalls: {
      datasetSlug: 'calls-for-service-fire',
      resourceId: '3f3bb1b6-dfe3-4b69-9a5d-cedef4264087',
      addressField: 'INCIDENT_ADDRESS',
      dateField: 'REPORTED',
      typeField: 'NATURE_CODE',
      categoryField: 'CATEGORY'
    },
    buildingPermits: {
      datasetSlug: 'phoenix-az-building-permit-data',
      resourceId: '1c61b4b2-1968-4c4b-8ff8-eb44f573e47a'
    }
  }
]

export function getCKANCityByName(name: string): CKANDataset | undefined {
  return CKAN_CITIES.find(city => city.name === name)
}

export function getCKANCitiesGroupedByState(filter?: 'fireCalls' | 'buildingPermits' | 'codeViolations'): Record<string, CKANDataset[]> {
  const filtered = filter
    ? CKAN_CITIES.filter(c => c[filter])
    : CKAN_CITIES
  return filtered.reduce((groups, city) => {
    if (!groups[city.state]) groups[city.state] = []
    groups[city.state].push(city)
    return groups
  }, {} as Record<string, CKANDataset[]>)
}
