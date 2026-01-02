export interface PropertyData {
  id: string
  source: string
  status: 'matched' | 'no_match' | 'error'
  matchScore?: number
  
  // Input data
  inputAddress?: string
  inputCity?: string
  inputState?: string
  inputZip?: string
  inputParcelId?: string
  
  // Property details
  parcelId?: string
  siteAddress?: string
  ownerName?: string
  ownerName2?: string
  
  // Mailing address
  mailingAddress?: string
  mailingCity?: string
  mailingState?: string
  mailingZip?: string
  
  // Property info
  propertyType?: string
  assessedValue?: number
  landValue?: number
  improvementValue?: number
  acres?: number
  
  // Additional fields
  county?: string
  taxYear?: string
  [key: string]: any
}

export interface StateConfig {
  code: string
  name: string
  url: string
  type: 'statewide' | 'county'
  counties?: CountyConfig[]
}

export interface CountyConfig {
  name: string
  url: string
  parcelField: string
  ownerField: string
  mailingAddressField: string
  mailingCityField: string
  mailingStateField?: string
  mailingZipField: string
  situsField?: string
  cityField?: string
  zipField?: string
  outFields: string[]
}

export type SearchType = 'address' | 'parcel'

export interface CSVRow {
  [key: string]: string
}
