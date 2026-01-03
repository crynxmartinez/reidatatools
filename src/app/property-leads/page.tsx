'use client'

import Link from 'next/link'
import { AlertTriangle, FileText, ArrowRight } from 'lucide-react'

export default function PropertyLeadsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Property Leads</h1>
        <p className="text-gray-600 mt-1">
          Find potential investment opportunities using public data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Code Violations Card */}
        <Link href="/property-leads/code-violations" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-orange-500">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Code Violations</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Find properties with code violations - potential distressed properties
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Available cities: Dallas, Houston, Austin, San Antonio, Fort Worth
              </p>
            </div>
          </div>
        </Link>

        {/* Building Permits Card */}
        <Link href="/property-leads/permits" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Building Permits</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Track renovation activity and new construction in your area
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Available cities: Dallas, Houston, Austin, San Antonio, Fort Worth
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use Property Leads</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="font-bold mr-2">1.</span>
            <span><strong>Code Violations:</strong> Properties with violations may have motivated sellers. Look for overgrown lots, unsafe structures, or multiple violations.</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">2.</span>
            <span><strong>Building Permits:</strong> Track flips in progress, find comps, or identify areas with development activity.</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">3.</span>
            <span><strong>Export to CSV:</strong> Download results and use with the Data Extractor to get owner information.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
