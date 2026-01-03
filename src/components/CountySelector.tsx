'use client'

import { Building2 } from 'lucide-react'
import { CountyConfig } from '@/types'

interface CountySelectorProps {
  counties: CountyConfig[]
  selectedCounty: string
  onCountyChange: (county: string) => void
}

export default function CountySelector({ counties, selectedCounty, onCountyChange }: CountySelectorProps) {
  if (counties.length <= 1) {
    return null
  }

  return (
    <div>
      <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-2">
        <Building2 className="inline w-4 h-4 mr-1" />
        Select County
      </label>
      <select
        id="county"
        value={selectedCounty}
        onChange={(e) => onCountyChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors bg-white text-gray-900"
      >
        <option value="" className="text-gray-500">-- Choose a county --</option>
        <option value="all" className="text-gray-900 bg-white py-2 font-semibold">
          🔍 Check All Counties
        </option>
        {counties.map((county, index) => (
          <option key={index} value={index.toString()} className="text-gray-900 bg-white py-2">
            {county.name}
          </option>
        ))}
      </select>
      {selectedCounty === 'all' && (
        <p className="mt-2 text-sm text-blue-600">
          🔍 Will search through all {counties.length} counties
        </p>
      )}
      {selectedCounty && selectedCounty !== 'all' && (
        <p className="mt-2 text-sm text-gray-600">
          ✓ Using {counties[parseInt(selectedCounty)]?.name} data
        </p>
      )}
    </div>
  )
}
