'use client'

import { PropertyData } from '@/types'
import { Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'

interface ResultsTableProps {
  results: PropertyData[]
  isProcessing: boolean
}

export default function ResultsTable({ results, isProcessing }: ResultsTableProps) {
  const handleDownload = () => {
    const csvData = results.map(r => ({
      'Status': r.status,
      'Match Score': r.matchScore || '',
      'Input Address': r.inputAddress || '',
      'Input City': r.inputCity || '',
      'Input State': r.inputState || '',
      'Input Zip': r.inputZip || '',
      'Input Parcel ID': r.inputParcelId || '',
      'Parcel ID': r.parcelId || '',
      'Site Address': r.siteAddress || '',
      'Site City': r.siteCity || '',
      'Site State': r.siteState || '',
      'Site Zip': r.siteZip || '',
      'Owner Name': r.ownerName || '',
      'Owner Name 2': r.ownerName2 || '',
      'Mailing Address': r.mailingAddress || '',
      'Mailing City': r.mailingCity || '',
      'Mailing State': r.mailingState || '',
      'Mailing Zip': r.mailingZip || '',
      'Property Type': r.propertyType || '',
      'Assessed Value': r.assessedValue || '',
      'Land Value': r.landValue || '',
      'Improvement Value': r.improvementValue || '',
      'Acres': r.acres || '',
      'County': r.county || '',
      'Tax Year': r.taxYear || '',
      'Source': r.source || '',
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `property_data_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'no_match':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (status) {
      case 'matched':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Matched</span>
      case 'no_match':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>No Match</span>
      case 'error':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Error</span>
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>
    }
  }

  const matchedCount = results.filter(r => r.status === 'matched').length
  const noMatchCount = results.filter(r => r.status === 'no_match').length
  const errorCount = results.filter(r => r.status === 'error').length

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Results</h2>
          <p className="text-sm text-gray-600 mt-1">
            {matchedCount} matched · {noMatchCount} no match · {errorCount} errors · {results.length} total
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={isProcessing || results.length === 0}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Download CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Input
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mailing Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Site Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                County
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parcel ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Match Score
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(result.status)}
                    <span className="ml-2">{getStatusBadge(result.status)}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900">
                    {result.inputAddress || result.inputParcelId || '-'}
                  </div>
                  {result.inputCity && (
                    <div className="text-sm text-gray-500">
                      {result.inputCity}, {result.inputState} {result.inputZip}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900">{result.ownerName || '-'}</div>
                  {result.ownerName2 && (
                    <div className="text-sm text-gray-500">{result.ownerName2}</div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900">{result.mailingAddress || '-'}</div>
                  {result.mailingCity && (
                    <div className="text-sm text-gray-500">
                      {result.mailingCity}, {result.mailingState} {result.mailingZip}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900">{result.siteAddress || '-'}</div>
                  {result.siteCity && (
                    <div className="text-sm text-gray-500">
                      {result.siteCity}, {result.siteState} {result.siteZip}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {result.county || '-'}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {result.parcelId || '-'}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {result.matchScore ? `${result.matchScore}%` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {results.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No results yet. Upload a CSV file to get started.
        </div>
      )}
    </div>
  )
}
