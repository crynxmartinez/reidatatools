import { StateConfig } from '@/types'

export const STATES: StateConfig[] = [
  {
    code: 'TX',
    name: 'Texas',
    type: 'county',
    url: '',
    counties: [
      // Dallas-Fort Worth Metroplex
      {
        name: 'Dallas County',
        url: 'https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0',
        parcelField: 'ACCT',
        ownerField: 'TAXPANAME1',
        mailingAddressField: 'TAXPAADD1',
        mailingCityField: 'TAXPACITY',
        mailingStateField: 'TAXPASTA',
        mailingZipField: 'TAXPAZIP',
        cityField: 'CITY',
        outFields: ['ACCT', 'CITY', 'COUNTY', 'ST_NUM', 'ST_DIR', 'ST_NAME', 'ST_TYPE', 'UNITID', 'TAXPANAME1', 'TAXPANAME2', 'TAXPAADD1', 'TAXPACITY', 'TAXPASTA', 'TAXPAZIP']
      },
      {
        name: 'Tarrant County',
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
        name: 'Collin County',
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
        name: 'Denton County',
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
      // Houston Metro
      {
        name: 'Harris County',
        url: 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0',
        parcelField: 'HCAD_NUM',
        ownerField: 'OWNER',
        mailingAddressField: 'MAIL_ADDR',
        mailingCityField: 'MAIL_CITY',
        mailingStateField: 'MAIL_STATE',
        mailingZipField: 'MAIL_ZIP',
        situsField: 'SITUS',
        cityField: 'CITY',
        zipField: 'ZIP',
        outFields: ['HCAD_NUM', 'OWNER', 'MAIL_ADDR', 'MAIL_CITY', 'MAIL_STATE', 'MAIL_ZIP', 'SITUS', 'CITY', 'ZIP', 'LEGAL1', 'MARKET_VALUE', 'APPRAISED_VALUE']
      },
      {
        name: 'Fort Bend County',
        url: 'https://arcgisweb.fortbendcountytx.gov/arcgis/rest/services/General/Parcels/MapServer/0',
        parcelField: 'PROP_ID',
        ownerField: 'OWNER_NAME',
        mailingAddressField: 'MAIL_ADDR',
        mailingCityField: 'MAIL_CITY',
        mailingStateField: 'MAIL_STATE',
        mailingZipField: 'MAIL_ZIP',
        situsField: 'SITUS_ADDR',
        cityField: 'SITUS_CITY',
        zipField: 'SITUS_ZIP',
        outFields: ['PROP_ID', 'OWNER_NAME', 'MAIL_ADDR', 'MAIL_CITY', 'MAIL_STATE', 'MAIL_ZIP', 'SITUS_ADDR', 'SITUS_CITY', 'SITUS_ZIP', 'LEGAL_DESC', 'MARKET_VALUE']
      },
      {
        name: 'Montgomery County',
        url: 'https://gis.mctx.org/arcgis/rest/services/Parcels/MapServer/0',
        parcelField: 'PROP_ID',
        ownerField: 'OWNER',
        mailingAddressField: 'MAIL_ADDR',
        mailingCityField: 'MAIL_CITY',
        mailingStateField: 'MAIL_STATE',
        mailingZipField: 'MAIL_ZIP',
        situsField: 'SITUS',
        cityField: 'CITY',
        zipField: 'ZIP',
        outFields: ['PROP_ID', 'OWNER', 'MAIL_ADDR', 'MAIL_CITY', 'MAIL_STATE', 'MAIL_ZIP', 'SITUS', 'CITY', 'ZIP']
      },
      // Austin Metro
      {
        name: 'Travis County',
        url: 'https://taxmaps.traviscountytx.gov/arcgis/rest/services/Parcels/MapServer/0',
        parcelField: 'PROP_ID',
        ownerField: 'OWNER_NAME',
        mailingAddressField: 'MAIL_ADDR',
        mailingCityField: 'MAIL_CITY',
        mailingStateField: 'MAIL_STATE',
        mailingZipField: 'MAIL_ZIP',
        situsField: 'SITUS_ADDR',
        cityField: 'SITUS_CITY',
        zipField: 'SITUS_ZIP',
        outFields: ['PROP_ID', 'OWNER_NAME', 'MAIL_ADDR', 'MAIL_CITY', 'MAIL_STATE', 'MAIL_ZIP', 'SITUS_ADDR', 'SITUS_CITY', 'SITUS_ZIP', 'LEGAL_DESC', 'MARKET_VALUE']
      },
      {
        name: 'Williamson County',
        url: 'https://gis.wilco.org/arcgis/rest/services/Parcels/MapServer/0',
        parcelField: 'PROP_ID',
        ownerField: 'OWNER_NAME',
        mailingAddressField: 'MAIL_ADDR',
        mailingCityField: 'MAIL_CITY',
        mailingStateField: 'MAIL_STATE',
        mailingZipField: 'MAIL_ZIP',
        situsField: 'SITUS_ADDR',
        cityField: 'SITUS_CITY',
        zipField: 'SITUS_ZIP',
        outFields: ['PROP_ID', 'OWNER_NAME', 'MAIL_ADDR', 'MAIL_CITY', 'MAIL_STATE', 'MAIL_ZIP', 'SITUS_ADDR', 'SITUS_CITY', 'SITUS_ZIP']
      },
      // San Antonio Metro
      {
        name: 'Bexar County',
        url: 'https://maps.bexar.org/arcgis/rest/services/Parcels/MapServer/0',
        parcelField: 'PROP_ID',
        ownerField: 'OWNER_NAME',
        mailingAddressField: 'MAIL_ADDR',
        mailingCityField: 'MAIL_CITY',
        mailingStateField: 'MAIL_STATE',
        mailingZipField: 'MAIL_ZIP',
        situsField: 'SITUS_ADDR',
        cityField: 'SITUS_CITY',
        zipField: 'SITUS_ZIP',
        outFields: ['PROP_ID', 'OWNER_NAME', 'MAIL_ADDR', 'MAIL_CITY', 'MAIL_STATE', 'MAIL_ZIP', 'SITUS_ADDR', 'SITUS_CITY', 'SITUS_ZIP', 'MARKET_VALUE', 'APPRAISED_VALUE']
      },
      // El Paso
      {
        name: 'El Paso County',
        url: 'https://gis.elpasotexas.gov/arcgis/rest/services/Parcels/MapServer/0',
        parcelField: 'PROP_ID',
        ownerField: 'OWNER_NAME',
        mailingAddressField: 'MAIL_ADDR',
        mailingCityField: 'MAIL_CITY',
        mailingStateField: 'MAIL_STATE',
        mailingZipField: 'MAIL_ZIP',
        situsField: 'SITUS_ADDR',
        cityField: 'SITUS_CITY',
        zipField: 'SITUS_ZIP',
        outFields: ['PROP_ID', 'OWNER_NAME', 'MAIL_ADDR', 'MAIL_CITY', 'MAIL_STATE', 'MAIL_ZIP', 'SITUS_ADDR', 'SITUS_CITY', 'SITUS_ZIP']
      },
      // Hidalgo (Rio Grande Valley)
      {
        name: 'Hidalgo County',
        url: 'https://gis.hidalgocounty.us/arcgis/rest/services/Parcels/MapServer/0',
        parcelField: 'PROP_ID',
        ownerField: 'OWNER_NAME',
        mailingAddressField: 'MAIL_ADDR',
        mailingCityField: 'MAIL_CITY',
        mailingStateField: 'MAIL_STATE',
        mailingZipField: 'MAIL_ZIP',
        situsField: 'SITUS_ADDR',
        cityField: 'SITUS_CITY',
        zipField: 'SITUS_ZIP',
        outFields: ['PROP_ID', 'OWNER_NAME', 'MAIL_ADDR', 'MAIL_CITY', 'MAIL_STATE', 'MAIL_ZIP', 'SITUS_ADDR', 'SITUS_CITY', 'SITUS_ZIP']
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
