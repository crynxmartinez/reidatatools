'use client'

import { useState } from 'react'
import { BookOpen, Search, Download, Loader2, ExternalLink, ChevronDown, ChevronUp, User } from 'lucide-react'
import { OBITUARY_SOURCES, DATE_RANGE_OPTIONS } from '@/config/obituaries'
import Papa from 'papaparse'

interface Obituary {
  name: string
  date: string
  city: string
  state: string
  funeralHome: string
  survivedBy: string
  snippet: string
  detailUrl: string
  imageUrl?: string
  source: string
  county: string
}

export default function ObituariesPage() {
  const [sourceId, setSourceId] = useState('harris-tx')
  const [keyword, setKeyword] = useState('')
  const [city, setCity] = useState('')
  const [days, setDays] = useState('30')
  const [results, setResults] = useState<Obituary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [details, setDetails] = useState<Record<number, { fullText: string; survivedBy: string; funeralHome: string; loading: boolean }>>({})

  const selectedSource = OBITUARY_SOURCES.find(s => s.id === sourceId)

  const handleSearch = async () => {
    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    setResults([])
    setExpanded(null)
    setDetails({})

    try {
      const response = await fetch('/api/obituaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, keyword: keyword || undefined, city: city || undefined, days })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch')
      setResults(data.obituaries || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExpand = async (index: number, detailUrl: string) => {
    if (expanded === index) { setExpanded(null); return }
    setExpanded(index)
    if (details[index] && !details[index].loading) return

    setDetails(prev => ({ ...prev, [index]: { fullText: '', survivedBy: '', funeralHome: '', loading: true } }))

    try {
      const response = await fetch('/api/obituaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, action: 'detail', detailUrl })
      })
      const data = await response.json()
      setDetails(prev => ({
        ...prev,
        [index]: {
          fullText: data.fullText || 'No content found.',
          survivedBy: data.survivedBy || '',
          funeralHome: data.funeralHome || '',
          loading: false
        }
      }))
      if (data.survivedBy) {
        setResults(prev => prev.map((o, i) => i === index ? { ...o, survivedBy: data.survivedBy } : o))
      }
    } catch {
      setDetails(prev => ({ ...prev, [index]: { fullText: 'Failed to load.', survivedBy: '', funeralHome: '', loading: false } }))
    }
  }

  const handleDownload = () => {
    if (!results.length) return
    const csv = Papa.unparse(results.map(o => ({
      'Name': o.name,
      'Date': o.date,
      'City': o.city,
      'State': o.state,
      'County': o.county,
      'Funeral Home': o.funeralHome,
      'Survived By': o.survivedBy,
      'Snippet': o.snippet,
      'Detail URL': o.detailUrl,
      'Source': o.source
    })))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `obituaries_${sourceId}_${new Date().toISOString().split('T')[0]}.csv`
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-rose-500" />
          Obituaries
        </h1>
        <p className="text-gray-600 mt-1">
          Pre-probate leads — find recently deceased property owners before probate filings go public
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
            <select
              value={sourceId}
              onChange={e => { setSourceId(e.target.value); setCity('') }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white text-gray-900"
            >
              {OBITUARY_SOURCES.map(s => (
                <option key={s.id} value={s.id}>{s.county} County, {s.stateCode} — {s.name}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City (optional)</label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white text-gray-900"
            >
              <option value="">All Cities</option>
              {selectedSource?.cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={days}
              onChange={e => setDays(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white text-gray-900"
            >
              {DATE_RANGE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Keyword */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Keyword (optional)</label>
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="name, city, funeral home..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="flex items-center px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" />Searching...</>
          ) : (
            <><Search className="w-5 h-5 mr-2" />Search Obituaries</>
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
              <p className="text-sm text-gray-500">{results.length} obituaries found</p>
            )}
          </div>
          {results.length > 0 && (
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            <span className="ml-3 text-gray-600">Fetching obituaries from {selectedSource?.name}...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            {results.map((obit, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Card Row */}
                <div className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {obit.imageUrl ? (
                      <img src={obit.imageUrl} alt={obit.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-rose-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{obit.name}</h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-500">
                          {obit.date && <span>{obit.date}</span>}
                          {obit.city && <span>{obit.city}, {obit.state}</span>}
                          {obit.funeralHome && <span>{obit.funeralHome}</span>}
                        </div>
                        {obit.survivedBy && (
                          <p className="text-xs text-rose-700 mt-1 italic line-clamp-1">{obit.survivedBy}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={obit.detailUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-rose-600"
                          title="Open on Legacy.com"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleExpand(index, obit.detailUrl)}
                          className="flex items-center px-3 py-1 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 text-xs font-medium transition-colors"
                        >
                          {expanded === index ? (
                            <><ChevronUp className="w-3.5 h-3.5 mr-1" />Hide</>
                          ) : (
                            <><ChevronDown className="w-3.5 h-3.5 mr-1" />View</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {expanded === index && (
                  <div className="border-t border-gray-200 bg-rose-50 p-4">
                    {details[index]?.loading ? (
                      <div className="flex items-center py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500 mr-2" />
                        <span className="text-sm text-gray-600">Loading full obituary...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {details[index]?.survivedBy && (
                          <div className="bg-white rounded-lg p-3 border border-rose-200">
                            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide mb-1">Survived By</p>
                            <p className="text-sm text-gray-800">{details[index].survivedBy}</p>
                          </div>
                        )}
                        {details[index]?.funeralHome && (
                          <div className="bg-white rounded-lg p-3 border border-rose-200">
                            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide mb-1">Funeral Home</p>
                            <p className="text-sm text-gray-800">{details[index].funeralHome}</p>
                          </div>
                        )}
                        {details[index]?.fullText && (
                          <div className="bg-white rounded-lg p-3 border border-rose-200">
                            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide mb-1">Full Obituary</p>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {details[index].fullText}
                            </p>
                          </div>
                        )}
                        <a
                          href={obit.detailUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-rose-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View on Legacy.com
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : hasSearched ? (
          <div className="text-center py-16 text-gray-500">
            No obituaries found. Try a different date range or remove the city filter.
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Select a source and click "Search Obituaries" to find pre-probate leads.</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 bg-rose-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-rose-900 mb-2">How to Use Obituary Leads</h3>
        <ul className="space-y-2 text-sm text-rose-800">
          <li><strong>Pre-probate advantage:</strong> Obituaries appear weeks before probate court filings — contact heirs first</li>
          <li><strong>Find surviving heirs:</strong> Expand any obituary to see "Survived By" — these are your potential sellers</li>
          <li><strong>Skip trace heirs:</strong> Use the Skip Trace tool to find contact info for surviving spouses/children</li>
          <li><strong>Coverage:</strong> Harris County, TX via Houston Chronicle (Legacy.com) — all cities in the metro area</li>
        </ul>
      </div>
    </div>
  )
}
