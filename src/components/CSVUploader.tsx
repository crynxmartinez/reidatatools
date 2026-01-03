'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import { SearchType, PropertyData, CSVRow } from '@/types'
import { processPropertyData } from '@/services/arcgis'
import ColumnMapper from './ColumnMapper'

interface CSVUploaderProps {
  selectedState: string
  selectedCounty: string
  searchType: SearchType
  onResults: (results: PropertyData[]) => void
  onProcessingChange: (isProcessing: boolean) => void
}

interface ParsedCSV {
  headers: string[]
  data: Record<string, string>[]
}

export default function CSVUploader({ 
  selectedState,
  selectedCounty,
  searchType, 
  onResults, 
  onProcessingChange 
}: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [showMapper, setShowMapper] = useState(false)
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!selectedState) {
      setError('Please select a state first')
      return
    }

    setError('')
    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as Record<string, string>[]
        
        if (data.length === 0) {
          setError('CSV file is empty')
          return
        }

        const headers = Object.keys(data[0])
        
        // Store parsed data and show column mapper
        setParsedCSV({ headers, data })
        setShowMapper(true)
      },
      error: (error) => {
        setError('Error parsing CSV: ' + error.message)
      }
    })
  }

  const handleMappingComplete = async (mapping: Record<string, string>) => {
    if (!parsedCSV) return

    setShowMapper(false)
    onProcessingChange(true)

    try {
      setProgress({ current: 0, total: parsedCSV.data.length })
      const processedResults: PropertyData[] = []

      for (let i = 0; i < parsedCSV.data.length; i++) {
        const originalRow = parsedCSV.data[i]
        setProgress({ current: i + 1, total: parsedCSV.data.length })

        // Map the row using the user's column mapping
        const mappedRow: CSVRow = {}
        Object.entries(mapping).forEach(([expectedKey, csvColumn]) => {
          mappedRow[expectedKey] = originalRow[csvColumn] || ''
        })

        try {
          const result = await processPropertyData(
            selectedState,
            selectedCounty,
            searchType,
            mappedRow
          )
          processedResults.push(result)
        } catch (rowError: any) {
          console.error(`Error processing row ${i + 1}:`, rowError)
          processedResults.push({
            id: Math.random().toString(36),
            source: selectedState,
            status: 'error',
            inputParcelId: mappedRow['parcel id'],
            inputAddress: mappedRow['property address'],
          })
        }
      }

      onResults(processedResults)
      setProgress(null)
      onProcessingChange(false)
    } catch (err) {
      setError('Error processing CSV: ' + (err instanceof Error ? err.message : 'Unknown error'))
      onProcessingChange(false)
      setProgress(null)
    }
  }

  const handleMappingCancel = () => {
    setShowMapper(false)
    setParsedCSV(null)
    setFileName('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'text/csv') {
      handleFile(file)
    } else {
      setError('Please upload a CSV file')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  // Show column mapper if we have parsed CSV data
  if (showMapper && parsedCSV) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="inline w-4 h-4 mr-1" />
          {fileName} ({parsedCSV.data.length} rows)
        </label>
        <ColumnMapper
          csvHeaders={parsedCSV.headers}
          searchType={searchType}
          onMappingComplete={handleMappingComplete}
          onCancel={handleMappingCancel}
        />
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload CSV File
      </label>
      
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
          ${!selectedState ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
          disabled={!selectedState}
        />
        
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        
        {fileName && !showMapper ? (
          <div className="flex items-center justify-center text-sm text-gray-600">
            <FileText className="w-4 h-4 mr-2" />
            {fileName}
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-1">
              Drag and drop your CSV file here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              {!selectedState ? 'Select a state first' : 'CSV files only'}
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {progress && (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Processing...</span>
            <span className="text-sm text-blue-700">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
