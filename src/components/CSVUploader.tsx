'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import { SearchType, PropertyData, CSVRow } from '@/types'
import { processPropertyData } from '@/services/arcgis'

interface CSVUploaderProps {
  selectedState: string
  searchType: SearchType
  onResults: (results: PropertyData[]) => void
  onProcessingChange: (isProcessing: boolean) => void
}

export default function CSVUploader({ 
  selectedState, 
  searchType, 
  onResults, 
  onProcessingChange 
}: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateHeaders = (headers: string[]): boolean => {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim())
    
    if (searchType === 'address') {
      const required = ['property address', 'property city', 'property state', 'property zip']
      return required.every(req => normalizedHeaders.includes(req))
    } else {
      return normalizedHeaders.includes('parcel id')
    }
  }

  const handleFile = async (file: File) => {
    if (!selectedState) {
      setError('Please select a state first')
      return
    }

    setError('')
    setFileName(file.name)
    onProcessingChange(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as CSVRow[]
        
        if (data.length === 0) {
          setError('CSV file is empty')
          onProcessingChange(false)
          return
        }

        const headers = Object.keys(data[0])
        if (!validateHeaders(headers)) {
          setError(
            searchType === 'address'
              ? 'Invalid CSV headers. Required: property address, property city, property state, property zip'
              : 'Invalid CSV header. Required: parcel id'
          )
          onProcessingChange(false)
          return
        }

        try {
          setProgress({ current: 0, total: data.length })
          const processedResults: PropertyData[] = []

          for (let i = 0; i < data.length; i++) {
            const row = data[i]
            setProgress({ current: i + 1, total: data.length })

            const result = await processPropertyData(
              selectedState,
              searchType,
              row
            )
            processedResults.push(result)
          }

          onResults(processedResults)
          setProgress(null)
          onProcessingChange(false)
        } catch (err) {
          setError('Error processing CSV: ' + (err instanceof Error ? err.message : 'Unknown error'))
          onProcessingChange(false)
          setProgress(null)
        }
      },
      error: (error) => {
        setError('Error parsing CSV: ' + error.message)
        onProcessingChange(false)
      }
    })
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
        
        {fileName ? (
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
