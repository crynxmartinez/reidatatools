'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Check, AlertCircle } from 'lucide-react'
import { SearchType } from '@/types'

interface ColumnMapperProps {
  csvHeaders: string[]
  searchType: SearchType
  onMappingComplete: (mapping: Record<string, string>) => void
  onCancel: () => void
}

// Expected fields for each search type
const EXPECTED_FIELDS = {
  address: [
    { key: 'property address', label: 'Property Address', required: true },
    { key: 'property city', label: 'Property City', required: true },
    { key: 'property state', label: 'Property State', required: true },
    { key: 'property zip', label: 'Property ZIP', required: true },
  ],
  parcel: [
    { key: 'parcel id', label: 'Parcel ID', required: true },
  ]
}

// Common variations of column names to auto-detect
const COLUMN_ALIASES: Record<string, string[]> = {
  'property address': ['address', 'street', 'street address', 'situs', 'situs address', 'property_address', 'prop_address', 'site address'],
  'property city': ['city', 'situs city', 'property_city', 'prop_city', 'site city'],
  'property state': ['state', 'st', 'situs state', 'property_state', 'prop_state'],
  'property zip': ['zip', 'zipcode', 'zip code', 'postal', 'postal code', 'situs zip', 'property_zip', 'prop_zip'],
  'parcel id': ['parcel', 'parcel_id', 'parcelid', 'apn', 'pin', 'property id', 'prop_id', 'account', 'acct', 'tax id', 'taxid'],
}

function findBestMatch(csvHeader: string, expectedField: string): boolean {
  const normalized = csvHeader.toLowerCase().trim()
  
  // Exact match
  if (normalized === expectedField) return true
  
  // Check aliases
  const aliases = COLUMN_ALIASES[expectedField] || []
  return aliases.some(alias => normalized === alias || normalized.includes(alias))
}

export default function ColumnMapper({
  csvHeaders,
  searchType,
  onMappingComplete,
  onCancel
}: ColumnMapperProps) {
  const expectedFields = EXPECTED_FIELDS[searchType]
  
  // Initialize mapping with auto-detected matches
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const initialMapping: Record<string, string> = {}
    
    expectedFields.forEach(field => {
      // Try to find a matching CSV header
      const match = csvHeaders.find(header => findBestMatch(header, field.key))
      if (match) {
        initialMapping[field.key] = match
      }
    })
    
    return initialMapping
  })

  const handleMappingChange = (expectedKey: string, csvColumn: string) => {
    setMapping(prev => ({
      ...prev,
      [expectedKey]: csvColumn
    }))
  }

  const isComplete = expectedFields
    .filter(f => f.required)
    .every(f => mapping[f.key])

  const handleConfirm = () => {
    if (isComplete) {
      onMappingComplete(mapping)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Your Columns</h3>
      <p className="text-sm text-gray-600 mb-4">
        Match your CSV columns to the expected fields. We've auto-detected some matches for you.
      </p>

      <div className="space-y-3">
        {expectedFields.map(field => (
          <div key={field.key} className="flex items-center gap-3">
            {/* Expected field label */}
            <div className="w-40 flex-shrink-0">
              <span className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />

            {/* CSV column dropdown */}
            <div className="flex-1">
              <select
                value={mapping[field.key] || ''}
                onChange={(e) => handleMappingChange(field.key, e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-gray-900 ${
                  mapping[field.key] 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 bg-white'
                }`}
              >
                <option value="" className="text-gray-500 bg-white">-- Select column --</option>
                {csvHeaders.map(header => (
                  <option key={header} value={header} className="text-gray-900 bg-white">
                    {header}
                  </option>
                ))}
              </select>
            </div>

            {/* Status icon */}
            <div className="w-6 flex-shrink-0">
              {mapping[field.key] ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : field.required ? (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Preview of detected columns */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs font-medium text-gray-500 mb-2">Your CSV columns:</p>
        <div className="flex flex-wrap gap-1">
          {csvHeaders.map(header => (
            <span
              key={header}
              className={`px-2 py-1 text-xs rounded ${
                Object.values(mapping).includes(header)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {header}
            </span>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isComplete}
          className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
            isComplete
              ? 'bg-primary-600 hover:bg-primary-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {isComplete ? 'Confirm & Process' : 'Map all required fields'}
        </button>
      </div>
    </div>
  )
}
