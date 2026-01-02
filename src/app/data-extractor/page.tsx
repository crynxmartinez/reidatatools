'use client'

import { useState } from 'react'
import StateSelector from '@/components/StateSelector'
import SearchTypeToggle from '@/components/SearchTypeToggle'
import CSVUploader from '@/components/CSVUploader'
import ResultsTable from '@/components/ResultsTable'
import { PropertyData } from '@/types'

export default function DataExtractorPage() {
  const [selectedState, setSelectedState] = useState<string>('')
  const [searchType, setSearchType] = useState<'address' | 'parcel'>('address')
  const [results, setResults] = useState<PropertyData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Property Data Extractor</h1>
          <p className="mt-2 text-gray-600">
            Extract property information using ArcGIS county assessor data
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <StateSelector 
              selectedState={selectedState}
              onStateChange={setSelectedState}
            />
            <SearchTypeToggle 
              searchType={searchType}
              onSearchTypeChange={setSearchType}
            />
          </div>

          <CSVUploader
            selectedState={selectedState}
            searchType={searchType}
            onResults={setResults}
            onProcessingChange={setIsProcessing}
          />
        </div>

        {results.length > 0 && (
          <ResultsTable 
            results={results}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </div>
  )
}
