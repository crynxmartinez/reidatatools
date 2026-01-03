import { StateConfig } from '@/types'

export const STATES: StateConfig[] = [
  {
    code: 'FL',
    name: 'Florida',
    type: 'statewide',
    url: 'https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0',
    counties: [{
      name: 'Statewide',
      url: 'https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0',
      parcelField: 'PARCEL_ID',
      ownerField: 'OWNER_NAME',
      mailingAddressField: 'MAIL_ADDR',
      mailingCityField: 'MAIL_CITY',
      mailingStateField: 'MAIL_STATE',
      mailingZipField: 'MAIL_ZIP',
      situsField: 'SITUS_ADDR',
      cityField: 'SITUS_CITY',
      zipField: 'SITUS_ZIP',
      outFields: ['PARCEL_ID', 'OWNER_NAME', 'MAIL_ADDR', 'MAIL_CITY', 'MAIL_STATE', 'MAIL_ZIP', 'SITUS_ADDR', 'SITUS_CITY', 'SITUS_ZIP']
    }]
  },
  {
    code: 'WI',
    name: 'Wisconsin',
    type: 'statewide',
    url: 'https://dnrmaps.wi.gov/arcgis/rest/services/DW_Map_Dynamic/EN_County_Tax_Parcels_WTM_Ext_Dynamic_L16/MapServer/0',
    counties: [{
      name: 'Statewide',
      url: 'https://dnrmaps.wi.gov/arcgis/rest/services/DW_Map_Dynamic/EN_County_Tax_Parcels_WTM_Ext_Dynamic_L16/MapServer/0',
      parcelField: 'PARCELID',
      ownerField: 'OWNERNME1',
      mailingAddressField: 'PSTLADRESS',
      mailingCityField: 'PLACENAME',
      mailingZipField: 'ZIPCODE',
      situsField: 'SITEADRESS',
      cityField: 'PLACENAME',
      zipField: 'ZIPCODE',
      outFields: ['PARCELID', 'TAXPARCELID', 'OWNERNME1', 'OWNERNME2', 'PSTLADRESS', 'SITEADRESS', 'PLACENAME', 'ZIPCODE', 'STATE', 'CNTASSDVALUE', 'PROPCLASS', 'CONAME']
    }]
  },
  {
    code: 'TX',
    name: 'Texas',
    type: 'county',
    url: '',
    counties: [
      {
        name: 'Tarrant County (TAD)',
        url: 'https://mapit.tarrantcounty.com/arcgis/rest/services/Dynamic/TADParcels/FeatureServer/0',
        parcelField: 'TAXPIN',
        ownerField: 'OWNER_NAME',
        mailingAddressField: 'OWNER_ADDR',
        mailingCityField: 'OWNER_CITY',
        mailingZipField: 'OWNER_ZIP',
        situsField: 'SITUS_ADDR',
        cityField: 'CITY',
        zipField: 'ZIPCODE',
        outFields: ['TAXPIN', 'ACCOUNT', 'OWNER_NAME', 'OWNER_ADDR', 'OWNER_CITY', 'OWNER_ZIP', 'OWNER_ZIP_', 'SITUS_ADDR', 'CITY', 'ZIPCODE', 'STATE']
      },
      {
        name: 'Collin County (CCAD)',
        url: 'https://services2.arcgis.com/uXyoacYrZTPTKD3R/ArcGIS/rest/services/CCAD_Parcel_Feature_Set/FeatureServer/4',
        parcelField: 'propID',
        ownerField: 'ownerName',
        mailingAddressField: 'ownerAddrLine1',
        mailingCityField: 'ownerAddrCity',
        mailingStateField: 'ownerAddrState',
        mailingZipField: 'ownerAddrZip',
        situsField: 'situsConcat',
        cityField: 'situsCity',
        zipField: 'situsZip',
        outFields: ['propID', 'ownerName', 'ownerAddrLine1', 'ownerAddrCity', 'ownerAddrState', 'ownerAddrZip', 'situsConcat', 'situsCity', 'situsZip']
      },
      {
        name: 'Denton County (DCAD)',
        url: 'https://maps.cityofdenton.com/server/rest/services/MapViewer/DCAD_Parcels/MapServer/0',
        parcelField: 'prop_id',
        ownerField: 'owner_name',
        mailingAddressField: 'addr_line1',
        mailingCityField: 'addr_city',
        mailingStateField: 'addr_state',
        mailingZipField: 'addr_zip',
        situsField: 'situs',
        cityField: 'situs_city',
        zipField: 'situs_zip',
        outFields: ['prop_id', 'owner_name', 'addr_line1', 'addr_city', 'addr_state', 'addr_zip', 'situs', 'situs_city', 'situs_zip', 'situs_state']
      },
      {
        name: 'Dallas Area (Multi-County)',
        url: 'https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0',
        parcelField: 'ACCT',
        ownerField: 'TAXPANAME1',
        mailingAddressField: 'TAXPAADD1',
        mailingCityField: 'TAXPACITY',
        mailingStateField: 'TAXPASTA',
        mailingZipField: 'TAXPAZIP',
        cityField: 'CITY',
        outFields: ['ACCT', 'CITY', 'COUNTY', 'ST_NUM', 'ST_DIR', 'ST_NAME', 'ST_TYPE', 'UNITID', 'TAXPANAME1', 'TAXPANAME2', 'TAXPAADD1', 'TAXPACITY', 'TAXPASTA', 'TAXPAZIP']
      }
    ]
  },
  {
    code: 'AZ',
    name: 'Arizona',
    type: 'county',
    url: '',
    counties: [
      {
        name: 'Maricopa County',
        url: 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0',
        parcelField: 'APN',
        ownerField: 'OWNER_NAME',
        mailingAddressField: 'MAIL_ADDRESS',
        mailingCityField: 'MAIL_CITY',
        mailingStateField: 'MAIL_STATE',
        mailingZipField: 'MAIL_ZIP',
        situsField: 'SITUS_ADDRESS',
        cityField: 'SITUS_CITY',
        zipField: 'SITUS_ZIP',
        outFields: ['APN', 'OWNER_NAME', 'MAIL_ADDRESS', 'MAIL_CITY', 'MAIL_STATE', 'MAIL_ZIP', 'SITUS_ADDRESS', 'SITUS_CITY', 'SITUS_ZIP']
      }
    ]
  },
  {
    code: 'CA',
    name: 'California',
    type: 'county',
    url: '',
    counties: [
      {
        name: 'Los Angeles County',
        url: 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/LA_County_Parcels/FeatureServer/0',
        parcelField: 'APN',
        ownerField: 'UseType',
        mailingAddressField: 'MailAddress',
        mailingCityField: 'MailCity',
        mailingZipField: 'MailZip',
        situsField: 'SitusAddress',
        cityField: 'SitusCity',
        zipField: 'SitusZIP',
        outFields: ['APN', 'UseType', 'MailAddress', 'MailCity', 'MailZip', 'SitusAddress', 'SitusCity', 'SitusZIP']
      }
    ]
  },
  {
    code: 'MI',
    name: 'Michigan',
    type: 'county',
    url: '',
    counties: [
      {
        name: 'Ingham County (VPN Required)',
        url: 'https://tr.ingham.org/arcgis/rest/services/Equalization/Parcels/MapServer/0',
        parcelField: 'PARCEL_ID',
        ownerField: 'OWNER_NAME',
        mailingAddressField: 'MAIL_ADDRESS',
        mailingCityField: 'MAIL_CITY',
        mailingStateField: 'MAIL_STATE',
        mailingZipField: 'MAIL_ZIP',
        situsField: 'SITUS_ADDRESS',
        cityField: 'SITUS_CITY',
        zipField: 'SITUS_ZIP',
        outFields: ['PARCEL_ID', 'OWNER_NAME', 'MAIL_ADDRESS', 'MAIL_CITY', 'MAIL_STATE', 'MAIL_ZIP', 'SITUS_ADDRESS', 'SITUS_CITY', 'SITUS_ZIP', 'ASSESSED_VALUE', 'TAXABLE_VALUE', 'LAND_VALUE', 'ACREAGE']
      },
      {
        name: 'Michigan Statewide (Fallback)',
        url: 'https://services3.arcgis.com/Jdnp1TjADvSDxMAX/arcgis/rest/services/Michigan_Parcels_v17a/FeatureServer/0',
        parcelField: 'PARCELNO',
        ownerField: 'OWNER1',
        mailingAddressField: 'MAIL_ADDR1',
        mailingCityField: 'MAIL_CITY',
        mailingStateField: 'MAIL_STATE',
        mailingZipField: 'MAIL_ZIP',
        situsField: 'SITUS_ADDR',
        cityField: 'SITUS_CITY',
        zipField: 'SITUS_ZIP',
        outFields: ['PARCELNO', 'OWNER1', 'OWNER2', 'MAIL_ADDR1', 'MAIL_CITY', 'MAIL_STATE', 'MAIL_ZIP', 'SITUS_ADDR', 'SITUS_CITY', 'SITUS_ZIP', 'COUNTY', 'ASSESSED_VALUE', 'TAXABLE_VALUE', 'LANDVALUE', 'ACREAGE']
      }
    ]
  }
]

export function getStateByCode(code: string): StateConfig | undefined {
  return STATES.find(state => state.code === code)
}

export function getAllStateCodes(): string[] {
  return STATES.map(state => state.code)
}
