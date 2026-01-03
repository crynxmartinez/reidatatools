'use client'

import Link from 'next/link'
import { Users, User, MapPin, Phone, ArrowRight } from 'lucide-react'

export default function SkipTracePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Users className="w-6 h-6 mr-2 text-blue-500" />
          Skip Trace
        </h1>
        <p className="text-gray-600 mt-1">
          Find contact information for property owners using multiple data sources
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Name Search Card */}
        <Link href="/skip-trace/name" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500 h-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Name Search</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Search by first & last name
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Find phone numbers, emails, and addresses for any person
              </p>
            </div>
          </div>
        </Link>

        {/* Address Lookup Card */}
        <Link href="/skip-trace/address" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500 h-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Address Lookup</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Find who lives at an address
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Get owner info, phone numbers, and relatives for any property
              </p>
            </div>
          </div>
        </Link>

        {/* Phone Lookup Card */}
        <Link href="/skip-trace/phone" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-purple-500 h-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Phone className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Phone Lookup</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Reverse phone number search
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Find the owner of any phone number
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Data Sources */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-gray-900">FastPeopleSearch</p>
              <p className="text-xs text-gray-500">Name, Address, Phone</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-gray-900">TruePeopleSearch</p>
              <p className="text-xs text-gray-500">Name, Address, Phone, Email</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-gray-900">CyberBackgroundChecks</p>
              <p className="text-xs text-gray-500">Name, Address, Phone</p>
            </div>
          </div>
        </div>
      </div>

      {/* API Usage */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">📊 API Usage</h3>
        <p className="text-sm text-blue-800">
          Skip tracing uses <strong>Scrape.do</strong> to bypass anti-bot protection. 
          Each search uses 1-3 API credits depending on how many sources you select.
        </p>
        <p className="text-sm text-blue-700 mt-2">
          Free tier: <strong>1,000 requests/month</strong> (until March 2026)
        </p>
      </div>
    </div>
  )
}
