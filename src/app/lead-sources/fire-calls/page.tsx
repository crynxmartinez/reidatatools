'use client'

import { useState } from 'react'
import { Search, Download, Flame, Loader2, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { getCKANCitiesGroupedByState } from '@/config/ckan'
import { fetchFireCalls, FireCall } from '@/services/ckan'
import Papa from 'papaparse'

function getDefaultFromDate() {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return date.toISOString().split('T')[0]
}

function getDefaultToDate() {
  return new Date().toISOString().split('T')[0]
}

export default function FireCallsPage() {
  const [selectedCity, setSelectedCity] = useState('')
  const [fromDate, setFromDate] = useState(getDefaultFromDate())
  const [toDate, setToDate] = useState(getDefaultToDate())
  const [category, setCategory] = useState('FIRE')
  const [results, setResults] = useState<FireCall[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [parcelResults, setParcelResults] = useState<Record<string, any[]>>({})
  const [parcelLoading, setParcelLoading] = useState<string | null>(null)

  const searchParcels = async (callId: string, address: string) => {
    if (expandedRow === callId && parcelResults[callId]) {
      setExpandedRow(null)
      return
    }

    setExpandedRow(callId)
    if (parcelResults[callId]) return

    setParcelLoading(callId)
    try {
      const response = await fetch('/api/parcel-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streetAddress: address,
          stateCode: 'AZ',
          countyIndex: 0
        })
      })
      const data = await response.json()
      setParcelResults(prev => ({ ...prev, [callId]: data.parcels || [] }))
    } catch (err) {
      setParcelResults(prev => ({ ...prev, [callId]: [] }))
    } finally {
      setParcelLoading(null)
    }
  }

  const handleSearch = async () => {
    if (!selectedCity) {
      setError('Please select a city')
      return
    }

    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const data = await fetchFireCalls({
        cityName: selectedCity,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        category: category || undefined,
        limit: 500
      })
      setResults(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (results.length === 0) return

    const csvData = results.map(r => ({
      'City': r.city,
      'Address': r.address,
      'Date': r.date,
      'Type': r.type,
      'Category': r.category || ''
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `fire_calls_${selectedCity}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Flame className="w-6 h-6 mr-2 text-red-500" />
          Fire Calls
        </h1>
        <p className="text-gray-600 mt-1">
          Find properties with fire incidents - potential fire-damaged properties for investment
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
            >
              <option value="">Select a city</option>
              {Object.entries(getCKANCitiesGroupedByState('fireCalls')).map(([state, cities]) => (
                <optgroup key={state} label={state}>
                  {cities.map(city => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
            >
              <option value="all">All Categories</option>
              <option value="FIRE">Fire</option>
              <option value="MEDICAL">Medical</option>
              <option value="HAZMAT">Hazmat</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={isLoading || !selectedCity}
              className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Results</h2>
            {hasSearched && (
              <p className="text-sm text-gray-600">
                {results.length} fire calls found
              </p>
            )}
          </div>
          {results.length > 0 && (
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <span className="ml-2 text-gray-600">Loading fire calls... (this may take a moment for large datasets)</span>
          </div>
        ) : results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((call, index) => {
                  const callKey = call.id || `fc-${index}`
                  const isExpanded = expandedRow === callKey
                  const parcels = parcelResults[callKey]
                  const isLoadingParcels = parcelLoading === callKey
                  return (
                    <>
                      <tr key={callKey} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-900 font-medium">{call.address}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{call.city}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{call.date}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{call.type}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            call.category?.toUpperCase().includes('FIRE')
                              ? 'bg-red-100 text-red-800'
                              : call.category?.toUpperCase().includes('MEDICAL')
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {call.category || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => searchParcels(callKey, call.address)}
                            disabled={isLoadingParcels}
                            className="flex items-center px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50"
                          >
                            {isLoadingParcels ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <MapPin className="w-3 h-3 mr-1" />
                            )}
                            Parcels
                            {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${callKey}-parcels`}>
                          <td colSpan={6} className="px-4 py-3 bg-blue-50">
                            {isLoadingParcels ? (
                              <div className="flex items-center py-4">
                                <Loader2 className="w-4 h-4 animate-spin text-primary-600 mr-2" />
                                <span className="text-sm text-gray-600">Searching parcels on this block...</span>
                              </div>
                            ) : parcels && parcels.length > 0 ? (
                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-2">{parcels.length} parcels found on this block:</p>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-xs">
                                    <thead>
                                      <tr className="bg-blue-100">
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">Address</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">Owner</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">Mailing Address</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">Parcel ID</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">Value</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {parcels.map((p: any, pi: number) => (
                                        <tr key={pi} className="border-t border-blue-200 hover:bg-blue-100">
                                          <td className="px-3 py-2 text-gray-900 font-medium">{p.address}</td>
                                          <td className="px-3 py-2 text-gray-700">{p.ownerName}</td>
                                          <td className="px-3 py-2 text-gray-600">{[p.mailingAddress, p.mailingCity, p.mailingState, p.mailingZip].filter(Boolean).join(', ')}</td>
                                          <td className="px-3 py-2 text-gray-600">{p.parcelId}</td>
                                          <td className="px-3 py-2 text-gray-600">{p.assessedValue ? `$${Number(p.assessedValue).toLocaleString()}` : '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 py-2">No parcels found on this block. The address may be an intersection or non-residential area.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : hasSearched ? (
          <div className="text-center py-12 text-gray-500">
            No fire calls found for the selected criteria.
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Select a city and date range, then click Search to find fire call records.
          </div>
        )}
      </div>
    </div>
  )
}
