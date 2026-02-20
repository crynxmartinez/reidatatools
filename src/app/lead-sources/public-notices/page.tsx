'use client'

import { useState } from 'react'
import { Newspaper, Search, Download, Loader2, ExternalLink, FileText, Filter } from 'lucide-react'
import { PUBLIC_NOTICE_SITES } from '@/config/publicNotices'
import Papa from 'papaparse'

interface PublicNotice {
  title: string
  date: string
  county: string
  newspaper: string
  noticeType: string
  snippet: string
  detailUrl: string
  pdfUrl?: string
  state: string
}

const NOTICE_TYPE_COLORS: Record<string, string> = {
  'Foreclosure': 'bg-red-100 text-red-700',
  'Probate': 'bg-purple-100 text-purple-700',
  'Tax Sale': 'bg-orange-100 text-orange-700',
  'Public Sale': 'bg-blue-100 text-blue-700',
  'Ordinance': 'bg-gray-100 text-gray-700',
  'Bids': 'bg-green-100 text-green-700',
  'Other': 'bg-gray-100 text-gray-600',
}

export default function PublicNoticesPage() {
  const [selectedSite, setSelectedSite] = useState('')
  const [keyword, setKeyword] = useState('foreclosure')
  const [county, setCounty] = useState('')
  const [noticeType, setNoticeType] = useState('all')
  const [results, setResults] = useState<PublicNotice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedNotice, setExpandedNotice] = useState<number | null>(null)
  const [noticeDetails, setNoticeDetails] = useState<Record<number, { content: string; pdfUrl?: string; loading: boolean }>>({})

  const selectedSiteConfig = PUBLIC_NOTICE_SITES.find(s => s.id === selectedSite)

  const handleSearch = async () => {
    if (!selectedSite) {
      setError('Please select a state')
      return
    }
    if (!keyword && !county) {
      setError('Please enter a keyword or select a county')
      return
    }

    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    setResults([])
    setExpandedNotice(null)
    setNoticeDetails({})

    try {
      const response = await fetch('/api/public-notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: selectedSite,
          keyword,
          county: county || undefined,
          noticeType: noticeType !== 'all' ? noticeType : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search')
      }

      setResults(data.notices || [])
    } catch (err: any) {
      setError(err.message || 'Failed to search')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetail = async (index: number, detailUrl: string) => {
    if (expandedNotice === index) {
      setExpandedNotice(null)
      return
    }

    setExpandedNotice(index)

    // If we already fetched this detail, don't fetch again
    if (noticeDetails[index] && !noticeDetails[index].loading) return

    setNoticeDetails(prev => ({ ...prev, [index]: { content: '', loading: true } }))

    try {
      const response = await fetch('/api/public-notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: selectedSite,
          action: 'detail',
          detailUrl
        })
      })

      const data = await response.json()

      if (response.ok) {
        setNoticeDetails(prev => ({
          ...prev,
          [index]: { content: data.content || 'No content found', pdfUrl: data.pdfUrl, loading: false }
        }))
        // Also update the notice's pdfUrl if found
        if (data.pdfUrl) {
          setResults(prev => prev.map((n, i) => i === index ? { ...n, pdfUrl: data.pdfUrl } : n))
        }
      } else {
        setNoticeDetails(prev => ({
          ...prev,
          [index]: { content: 'Failed to load detail', loading: false }
        }))
      }
    } catch {
      setNoticeDetails(prev => ({
        ...prev,
        [index]: { content: 'Failed to load detail', loading: false }
      }))
    }
  }

  const handleDownload = () => {
    if (results.length === 0) return

    const csvData = results.map(r => ({
      'Title': r.title,
      'Date': r.date,
      'County': r.county,
      'Type': r.noticeType,
      'Newspaper': r.newspaper,
      'State': r.state,
      'Detail URL': r.detailUrl,
      'PDF URL': r.pdfUrl || '',
      'Snippet': r.snippet
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `public_notices_${selectedSite}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Newspaper className="w-6 h-6 mr-2 text-indigo-500" />
          Public Notices
        </h1>
        <p className="text-gray-600 mt-1">
          Search foreclosures, probate, tax sales, and other legal notices from state press associations
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* State Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <select
              value={selectedSite}
              onChange={(e) => {
                setSelectedSite(e.target.value)
                setCounty('')
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-gray-900"
            >
              <option value="">-- Select State --</option>
              {PUBLIC_NOTICE_SITES.map(site => (
                <option key={site.id} value={site.id}>{site.state}</option>
              ))}
            </select>
          </div>

          {/* County */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              County (optional)
            </label>
            <select
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              disabled={!selectedSiteConfig}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-gray-900 disabled:opacity-50"
            >
              <option value="">All Counties</option>
              {selectedSiteConfig?.counties.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Keyword */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keyword *
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="foreclosure, probate, tax sale..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
            />
          </div>

          {/* Notice Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline w-4 h-4 mr-1" />
              Notice Type
            </label>
            <select
              value={noticeType}
              onChange={(e) => setNoticeType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-gray-900"
            >
              <option value="all">All Types</option>
              <option value="Foreclosure">Foreclosures</option>
              <option value="Probate">Probate</option>
              <option value="Tax Sale">Tax Sales</option>
              <option value="Public Sale">Public Sales</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Quick keyword buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm text-gray-500 py-1">Quick search:</span>
          {['foreclosure', 'probate', 'tax sale', 'estate', 'trustee sale', 'auction'].map(kw => (
            <button
              key={kw}
              onClick={() => setKeyword(kw)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                keyword === kw
                  ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                  : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {kw}
            </button>
          ))}
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading || !selectedSite || (!keyword && !county)}
          className="w-full md:w-auto flex items-center justify-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Search Notices
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
                {results.length} notices found
              </p>
            )}
          </div>
          {results.length > 0 && (
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600">Searching public notices...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {results.map((notice, index) => (
              <div key={index}>
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${NOTICE_TYPE_COLORS[notice.noticeType] || NOTICE_TYPE_COLORS['Other']}`}>
                          {notice.noticeType}
                        </span>
                        {notice.county && (
                          <span className="text-xs text-gray-500">{notice.county} County</span>
                        )}
                        {notice.date && (
                          <span className="text-xs text-gray-400">{notice.date}</span>
                        )}
                        {notice.newspaper && (
                          <span className="text-xs text-gray-400">via {notice.newspaper}</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {notice.title}
                      </h3>
                      {notice.snippet && notice.snippet !== notice.title && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {notice.snippet}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      {notice.pdfUrl && (
                        <a
                          href={notice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium"
                          title="Download PDF"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          PDF
                        </a>
                      )}
                      {notice.detailUrl && (
                        <button
                          onClick={() => handleViewDetail(index, notice.detailUrl)}
                          className="flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-medium"
                        >
                          {expandedNotice === index ? 'Hide' : 'View'}
                        </button>
                      )}
                      {notice.detailUrl && (
                        <a
                          href={notice.detailUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-indigo-600"
                          title="Open original"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {expandedNotice === index && (
                  <div className="border border-t-0 border-gray-200 rounded-b-lg p-4 bg-gray-50">
                    {noticeDetails[index]?.loading ? (
                      <div className="flex items-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mr-2" />
                        <span className="text-sm text-gray-600">Loading notice detail...</span>
                      </div>
                    ) : noticeDetails[index]?.content ? (
                      <div>
                        {noticeDetails[index]?.pdfUrl && (
                          <a
                            href={noticeDetails[index].pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium mb-3"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Download PDF
                          </a>
                        )}
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                          {noticeDetails[index].content}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No detail available</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : hasSearched ? (
          <div className="text-center py-12 text-gray-500">
            No notices found. Try different keywords or a different county.
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Select a state, enter a keyword, and click "Search Notices" to find public notices.
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 bg-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-2">About Public Notices</h3>
        <ul className="space-y-2 text-sm text-indigo-800">
          <li><strong>Foreclosures:</strong> Properties being foreclosed — contact owners before the sale</li>
          <li><strong>Probate:</strong> Estates being settled — heirs may want to sell inherited property</li>
          <li><strong>Tax Sales:</strong> Properties with delinquent taxes — potential below-market deals</li>
          <li><strong>Coverage:</strong> Alabama, Tennessee, and Georgia — all counties statewide</li>
        </ul>
      </div>
    </div>
  )
}
