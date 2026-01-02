'use client'

import { SearchType } from '@/types'
import { MapPin, FileText } from 'lucide-react'
import clsx from 'clsx'

interface SearchTypeToggleProps {
  searchType: SearchType
  onSearchTypeChange: (type: SearchType) => void
}

export default function SearchTypeToggle({ searchType, onSearchTypeChange }: SearchTypeToggleProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Search By
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onSearchTypeChange('address')}
          className={clsx(
            'flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all',
            searchType === 'address'
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          )}
        >
          <MapPin className="inline w-5 h-5 mr-2" />
          Property Address
        </button>
        <button
          type="button"
          onClick={() => onSearchTypeChange('parcel')}
          className={clsx(
            'flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all',
            searchType === 'parcel'
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          )}
        >
          <FileText className="inline w-5 h-5 mr-2" />
          Parcel ID
        </button>
      </div>
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          {searchType === 'address' ? (
            <>
              <strong>Required CSV Headers:</strong> property address, property city, property state, property zip
            </>
          ) : (
            <>
              <strong>Required CSV Header:</strong> parcel id
            </>
          )}
        </p>
      </div>
    </div>
  )
}
