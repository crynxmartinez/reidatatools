'use client'

import Link from 'next/link'
import { Search, Home as HomeIcon, Gavel, FileText, ArrowRight } from 'lucide-react'

export default function ScraperPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Search className="w-6 h-6 mr-2 text-purple-500" />
          Court Records Scraper
        </h1>
        <p className="text-gray-600 mt-1">
          Scrape public court records from Texas county clerk websites
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Evictions Card */}
        <Link href="/scraper/evictions" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-red-500 h-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <HomeIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Evictions</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Find landlords with problem tenants
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <strong>Use case:</strong> Contact landlords who just evicted - they may want to sell
              </p>
            </div>
          </div>
        </Link>

        {/* Foreclosures Card */}
        <Link href="/scraper/foreclosures" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-orange-500 h-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Gavel className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Foreclosures</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Pre-foreclosure and auction listings
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <strong>Use case:</strong> Reach distressed owners before auction
              </p>
            </div>
          </div>
        </Link>

        {/* Probate Card */}
        <Link href="/scraper/probate" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-purple-500 h-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Probate</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Inherited property cases
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <strong>Use case:</strong> Contact heirs who may want quick sale
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-yellow-50 rounded-lg p-6 border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h3>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span><strong>Rate Limiting:</strong> Scraping is throttled to avoid overloading county websites</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span><strong>Public Data:</strong> All data scraped is from public court records</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span><strong>Processing Time:</strong> Scraping may take 1-5 minutes depending on date range</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span><strong>Availability:</strong> Some counties may be temporarily unavailable</span>
          </li>
        </ul>
      </div>

      {/* Available Counties */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Counties</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['Dallas', 'Harris', 'Travis', 'Tarrant', 'Bexar'].map(county => (
            <div key={county} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">{county} County</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
