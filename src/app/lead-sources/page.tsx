'use client'

import Link from 'next/link'
import { AlertTriangle, FileText, Flame, Home as HomeIcon, Gavel, ArrowRight, Target } from 'lucide-react'
import { getCKANCitiesGroupedByState } from '@/config/ckan'
import { getCitiesGroupedByState } from '@/config/socrata'
import { SCRAPER_COUNTIES } from '@/config/scrapers'

export default function LeadSourcesPage() {
  const evictionCounties = SCRAPER_COUNTIES.filter(c => c.evictions).map(c => `${c.name}, ${c.state}`)
  const foreclosureCounties = SCRAPER_COUNTIES.filter(c => c.foreclosures).map(c => `${c.name}, ${c.state}`)
  const probateCounties = SCRAPER_COUNTIES.filter(c => c.probate).map(c => `${c.name}, ${c.state}`)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Target className="w-6 h-6 mr-2 text-primary-600" />
          Lead Sources
        </h1>
        <p className="text-gray-600 mt-1">
          Find motivated sellers and distressed properties from public data and court records
        </p>
      </div>

      {/* Property Data Section */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Property Data</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Code Violations */}
        <Link href="/lead-sources/code-violations" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-orange-500 h-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Code Violations</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Distressed properties with violations
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <strong>Use case:</strong> Owners with violations may be motivated to sell
              </p>
            </div>
          </div>
        </Link>

        {/* Building Permits */}
        <Link href="/lead-sources/permits" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500 h-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Building Permits</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Track renovation and construction activity
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <strong>Use case:</strong> Find flips in progress, comps, and development areas
              </p>
            </div>
          </div>
        </Link>

        {/* Fire Calls */}
        <Link href="/lead-sources/fire-calls" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-red-500 h-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Flame className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Fire Calls</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Fire-damaged properties
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <strong>Use case:</strong> Fire-damaged owners often sell below market
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Court Records Section */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Court Records</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Evictions */}
        <Link href="/lead-sources/evictions" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-red-500 h-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <HomeIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Evictions</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Landlords with problem tenants
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {evictionCounties.length > 0 ? evictionCounties.join(', ') : 'No counties configured'}
              </p>
            </div>
          </div>
        </Link>

        {/* Foreclosures */}
        <Link href="/lead-sources/foreclosures" className="block">
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
                {foreclosureCounties.length > 0 ? foreclosureCounties.join(', ') : 'No counties configured'}
              </p>
            </div>
          </div>
        </Link>

        {/* Probate */}
        <Link href="/lead-sources/probate" className="block">
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
                {probateCounties.length > 0 ? probateCounties.join(', ') : 'No counties configured'}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How It Works</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li><strong>1. Pick a source</strong> — Choose from property data or court records above</li>
          <li><strong>2. Set filters</strong> — Select location, date range, and other criteria</li>
          <li><strong>3. Get leads</strong> — Results include addresses, owners, and case details</li>
          <li><strong>4. Look up owners</strong> — Use the built-in owner lookup or Data Extractor for skip-tracing</li>
        </ul>
      </div>
    </div>
  )
}
