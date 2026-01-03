'use client'

import { useState } from 'react'
import { Search, Download, Home, Loader2, ExternalLink } from 'lucide-react'
import { SCRAPER_COUNTIES, getCountiesWithEvictions } from '@/config/scrapers'
import Papa from 'papaparse'

interface EvictionRecord {
  caseNumber: string
  filingDate: string
  plaintiff: string
  defendant: string
  address: string
  status: string
  county: string
  caseType?: string
  link?: string
}

export default function EvictionsPage() {
  const [selectedCounty, setSelectedCounty] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [results, setResults] = useState<EvictionRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [progress, setProgress] = useState('')

  const counties = getCountiesWithEvictions()

  const handleScrape = async () => {
    if (!selectedCounty) {
      setError('Please select a county')
      return
    }

    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    setProgress('Connecting to county website...')

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'evictions',
          county: selectedCounty,
          fromDate: fromDate || getDefaultFromDate(),
          toDate: toDate || getDefaultToDate()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape data')
      }

      setResults(data.results || [])
      setProgress('')
    } catch (err: any) {
      setError(err.message || 'Failed to scrape data')
      setResults([])
    } finally {
      setIsLoading(false)
      setProgress('')
    }
  }

  const handleDownload = () => {
    if (results.length === 0) return

    const csvData = results.map(r => ({
      'Case Number': r.caseNumber,
      'Filing Date': r.filingDate,
      'Plaintiff (Landlord)': r.plaintiff,
      'Defendant (Tenant)': r.defendant,
      'Address': r.address,
      'Status': r.status,
      'County': r.county
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `evictions_${selectedCounty}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getDefaultFromDate = () => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  }

  const getDefaultToDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  const getCountyUrl = () => {
    const county = SCRAPER_COUNTIES.find(c => c.name === selectedCounty)
    return county?.evictions?.searchUrl || '#'
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Home className="w-6 h-6 mr-2 text-red-500" />
          Eviction Records Scraper
        </h1>
        <p className="text-gray-600 mt-1">
          Scrape eviction filings from Texas & Oklahoma courts - find landlords with problem properties
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              County
            </label>
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
            >
              <option value="">Select a county</option>
              {counties.map(county => (
                <option key={county.name} value={county.name}>
                  {county.name} County, {county.state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={fromDate || getDefaultFromDate()}
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
              value={toDate || getDefaultToDate()}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleScrape}
              disabled={isLoading || !selectedCounty}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Scrape Now
                </>
              )}
            </button>
          </div>
        </div>

        {selectedCounty && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a 
              href={getCountyUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View source: {selectedCounty} County Court Records
            </a>
          </div>
        )}
      </div>

      {/* Progress */}
      {isLoading && progress && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          {progress}
        </div>
      )}

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
                {results.length} eviction records found
              </p>
            )}
          </div>
          {results.length > 0 && (
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            <span className="ml-2 text-gray-600">Scraping court records...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Case #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filing Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plaintiff (Landlord)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Defendant (Tenant)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((record, index) => (
                  <tr key={record.caseNumber || index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                      {record.link ? (
                        <a 
                          href={record.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {record.caseNumber}
                        </a>
                      ) : (
                        record.caseNumber
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {record.filingDate}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {record.plaintiff}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {record.defendant}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                      {record.address}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        record.status?.toLowerCase().includes('dismiss') || record.status?.toLowerCase().includes('closed')
                          ? 'bg-gray-100 text-gray-800'
                          : record.status?.toLowerCase().includes('judgment') || record.status?.toLowerCase().includes('final')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : hasSearched ? (
          <div className="text-center py-12 text-gray-500">
            No eviction records found for the selected criteria.
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Select a county and date range, then click "Scrape Now" to find eviction records.
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 How to Use This Data</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li><strong>1. Find the Landlord:</strong> The plaintiff is usually the property owner or management company</li>
          <li><strong>2. Skip-trace the Owner:</strong> Use the address to find owner info via Data Extractor</li>
          <li><strong>3. Reach Out:</strong> Landlords dealing with evictions may be motivated to sell</li>
          <li><strong>4. Look for Patterns:</strong> Multiple evictions at same address = problem property</li>
        </ul>
      </div>
    </div>
  )
}
