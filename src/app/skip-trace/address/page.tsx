'use client'

import { useState } from 'react'
import { MapPin, Search, Download, Loader2, ExternalLink, Phone, Mail, User, Users } from 'lucide-react'
import { US_STATES, SKIP_TRACE_SOURCES } from '@/config/skiptrace'
import Papa from 'papaparse'

interface SkipTraceResult {
  name: string
  age?: number
  addresses: {
    street: string
    city: string
    state: string
    zip: string
    current?: boolean
  }[]
  phones: {
    number: string
    type?: string
  }[]
  emails: string[]
  relatives: string[]
  source: string
  sourceUrl: string
}

export default function AddressLookupPage() {
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [selectedSources, setSelectedSources] = useState<string[]>(['fps', 'tps', 'cbc'])
  const [results, setResults] = useState<SkipTraceResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const handleSearch = async () => {
    if (!street || !city || !state) {
      setError('Please enter street address, city, and state')
      return
    }

    if (selectedSources.length === 0) {
      setError('Please select at least one data source')
      return
    }

    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const response = await fetch('/api/skip-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchType: 'address',
          sources: selectedSources,
          street,
          city,
          state,
          zip
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search')
      }

      setResults(data.results || [])
    } catch (err: any) {
      setError(err.message || 'Failed to search')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (results.length === 0) return

    const csvData = results.map(r => ({
      'Name': r.name,
      'Age': r.age || '',
      'Address': r.addresses[0]?.street || '',
      'City': r.addresses[0]?.city || '',
      'State': r.addresses[0]?.state || '',
      'Zip': r.addresses[0]?.zip || '',
      'Phone 1': r.phones[0]?.number || '',
      'Phone 2': r.phones[1]?.number || '',
      'Email': r.emails[0] || '',
      'Relatives': r.relatives.slice(0, 3).join('; '),
      'Source': r.source
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `skiptrace_address_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <MapPin className="w-6 h-6 mr-2 text-green-500" />
          Address Lookup
        </h1>
        <p className="text-gray-600 mt-1">
          Find who lives at a specific address - perfect for property owner lookup
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="123 Main Street"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Dallas"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-gray-900"
              >
                <option value="">State</option>
                {US_STATES.map(s => (
                  <option key={s.code} value={s.code}>{s.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zip
              </label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="75201"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Sources
          </label>
          <div className="flex flex-wrap gap-3">
            {SKIP_TRACE_SOURCES.map(source => (
              <label
                key={source.id}
                className={`flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                  selectedSources.includes(source.id)
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSources.includes(source.id)}
                  onChange={() => toggleSource(source.id)}
                  className="mr-2"
                />
                {source.name}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading || !street || !city || !state}
          className="w-full md:w-auto flex items-center justify-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Lookup Address
            </>
          )}
        </button>
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
                {results.length} residents found at this address
              </p>
            )}
          </div>
          {results.length > 0 && (
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <span className="ml-2 text-gray-600">Looking up address...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-full mr-3">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {result.name}
                        {result.age && <span className="text-gray-500 font-normal ml-2">Age {result.age}</span>}
                      </h3>
                      <p className="text-xs text-gray-500">Source: {result.source}</p>
                    </div>
                  </div>
                  {result.sourceUrl && (
                    <a
                      href={result.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Phones */}
                  {result.phones.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center">
                        <Phone className="w-3 h-3 mr-1" /> Phone Numbers
                      </p>
                      {result.phones.slice(0, 3).map((phone, i) => (
                        <p key={i} className="text-sm text-gray-700 font-medium">
                          {phone.number}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Emails */}
                  {result.emails.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center">
                        <Mail className="w-3 h-3 mr-1" /> Emails
                      </p>
                      {result.emails.slice(0, 2).map((email, i) => (
                        <p key={i} className="text-sm text-gray-700">{email}</p>
                      ))}
                    </div>
                  )}

                  {/* Relatives */}
                  {result.relatives.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center">
                        <Users className="w-3 h-3 mr-1" /> Relatives
                      </p>
                      <p className="text-sm text-gray-700">
                        {result.relatives.slice(0, 3).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : hasSearched ? (
          <div className="text-center py-12 text-gray-500">
            No residents found at this address.
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Enter an address and click "Lookup Address" to find residents.
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 Tips for Address Lookup</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li><strong>Property Owners:</strong> Use this to find contact info for absentee owners</li>
          <li><strong>Vacant Properties:</strong> Look up addresses from your driving for dollars list</li>
          <li><strong>Verify Data:</strong> Cross-reference with county records from Data Extractor</li>
        </ul>
      </div>
    </div>
  )
}
