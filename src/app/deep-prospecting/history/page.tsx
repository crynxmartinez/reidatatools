'use client'

import { useState, useEffect } from 'react'
import { History, Microscope, CheckCircle, XCircle, Clock, Trash2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { DeepProspectJob } from '@/config/deepProspect'
import Link from 'next/link'

export default function DeepProspectHistoryPage() {
  const [history, setHistory] = useState<DeepProspectJob[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('dp_history') || '[]') as DeepProspectJob[]
      setHistory(stored)
    } catch { setHistory([]) }
  }, [])

  const handleDelete = (id: string) => {
    const updated = history.filter(j => j.id !== id)
    setHistory(updated)
    localStorage.setItem('dp_history', JSON.stringify(updated))
  }

  const handleClearAll = () => {
    setHistory([])
    localStorage.removeItem('dp_history')
  }

  const safeResult = (result: any): string => {
    if (!result) return ''
    if (typeof result === 'string') return result
    return JSON.stringify(result, null, 2)
  }

  const handleCopy = (id: string, text: any) => {
    navigator.clipboard.writeText(safeResult(text))
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString()
    } catch { return iso }
  }

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (status === 'failed') return <XCircle className="w-4 h-4 text-red-500" />
    return <Clock className="w-4 h-4 text-violet-400 animate-pulse" />
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <History className="w-6 h-6 mr-2 text-violet-600" />
            Deep Prospect History
          </h1>
          <p className="text-gray-600 mt-1">{history.length} saved reports</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/deep-prospecting"
            className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
          >
            <Microscope className="w-4 h-4 mr-2" />
            New Research
          </Link>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No research history yet.</p>
          <Link href="/deep-prospecting" className="text-violet-600 hover:underline text-sm mt-2 inline-block">
            Run your first deep prospect →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(job => (
            <div key={job.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Row */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex-shrink-0">{statusIcon(job.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{job.ownerName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      job.status === 'completed' ? 'bg-green-100 text-green-700' :
                      job.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{job.address}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(job.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {job.result && (
                    <button
                      onClick={() => handleCopy(job.id, job.result!)}
                      className="p-1.5 text-gray-400 hover:text-violet-600 transition-colors"
                      title="Copy report"
                    >
                      {copied === job.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {job.result && (
                    <button
                      onClick={() => setExpanded(expanded === job.id ? null : job.id)}
                      className="flex items-center px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 text-xs font-medium transition-colors"
                    >
                      {expanded === job.id ? <><ChevronUp className="w-3.5 h-3.5 mr-1" />Hide</> : <><ChevronDown className="w-3.5 h-3.5 mr-1" />View</>}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded report */}
              {expanded === job.id && job.result && (
                <div className="border-t border-gray-200 bg-gray-50 p-5">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                    {safeResult(job.result)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
