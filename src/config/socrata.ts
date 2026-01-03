export interface SocrataCity {
  name: string
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
    name: 'Dallas',
    domain: 'www.dallasopendata.com',
    codeViolations: {
      datasetId: 'di53-hb4a',
      addressField: 'address',
      dateField: 'date_opened',
      typeField: 'violation_type',
      statusField: 'case_status',
      descriptionField: 'violation_description'
    },
    buildingPermits: {
      datasetId: 'mxb6-dfc9',
      addressField: 'address',
      dateField: 'issue_date',
      typeField: 'permit_type',
      statusField: 'status',
      descriptionField: 'work_description',
      costField: 'total_project_valuation'
    }
  },
  {
    name: 'Houston',
    domain: 'data.houstontx.gov',
    codeViolations: {
      datasetId: 'isme-6au2',
      addressField: 'block_address',
      dateField: 'violation_date',
      typeField: 'violation_type',
      statusField: 'status',
      descriptionField: 'violation_description'
    },
    buildingPermits: {
      datasetId: 'mty5-pd2c',
      addressField: 'street_address',
      dateField: 'issue_date',
      typeField: 'permit_type',
      statusField: 'status_current',
      descriptionField: 'project_description',
      costField: 'estimated_cost'
    }
  },
  {
    name: 'Austin',
    domain: 'data.austintexas.gov',
    codeViolations: {
      datasetId: 'awty-6cga',
      addressField: 'address',
      dateField: 'opened_date',
      typeField: 'case_type',
      statusField: 'case_status',
      descriptionField: 'description'
    },
    buildingPermits: {
      datasetId: 'x9yh-78fz',
      addressField: 'original_address',
      dateField: 'issue_date',
      typeField: 'permit_type_desc',
      statusField: 'status_current',
      descriptionField: 'work_class',
      costField: 'total_valuation'
    }
  },
  {
    name: 'San Antonio',
    domain: 'data.sanantonio.gov',
    codeViolations: {
      datasetId: 'xe4q-dz5s',
      addressField: 'full_address',
      dateField: 'case_opened_date',
      typeField: 'case_type',
      statusField: 'case_status',
      descriptionField: 'violation_description'
    },
    buildingPermits: {
      datasetId: 'dhfp-2gxp',
      addressField: 'address',
      dateField: 'issue_date',
      typeField: 'permit_type',
      statusField: 'status',
      descriptionField: 'description',
      costField: 'valuation'
    }
  },
  {
    name: 'Fort Worth',
    domain: 'data.fortworthtexas.gov',
    codeViolations: {
      datasetId: 'fsrw-4dqf',
      addressField: 'address',
      dateField: 'opened_date',
      typeField: 'case_type',
      statusField: 'status',
      descriptionField: 'description'
    },
    buildingPermits: {
      datasetId: 'qbk3-jnvx',
      addressField: 'address',
      dateField: 'issue_date',
      typeField: 'permit_type',
      statusField: 'status',
      descriptionField: 'description',
      costField: 'valuation'
    }
  }
]

export function getCityByName(name: string): SocrataCity | undefined {
  return SOCRATA_CITIES.find(city => city.name === name)
}
