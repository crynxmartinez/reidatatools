import { NextResponse } from 'next/server'
import axios from 'axios'

export async function GET() {
  try {
    // Test query to Dallas endpoint
    const url = 'https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0/query'
    
    const params = {
      f: 'json',
      where: "ST_NUM = '1242' AND UPPER(ST_NAME) LIKE '%BRIGHTON%'",
      outFields: '*',
      returnGeometry: 'false',
      resultRecordCount: 5
    }

    const response = await axios.get(url, { params, timeout: 30000 })
    
    return NextResponse.json({
      success: true,
      query: params.where,
      resultCount: response.data.features?.length || 0,
      features: response.data.features || [],
      error: response.data.error || null
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data || null
    }, { status: 500 })
  }
}
