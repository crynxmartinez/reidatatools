'use client'

import { useState, useEffect, useRef } from 'react'
import { Microscope, Search, Loader2, CheckCircle, XCircle, Copy, Check, ChevronDown, Clock } from 'lucide-react'
import { LEAD_TYPE_OPTIONS, DISTRESS_LEVEL_OPTIONS, DeepProspectJob } from '@/config/deepProspect'

const POLL_INTERVAL_MS = 5000

export default function DeepProspectingPage() {
  const [ownerName, setOwnerName] = useState('')
  const [address, setAddress] = useState('')
  const [leadType, setLeadType] = useState('foreclosure')
  const [distressLevel, setDistressLevel] = useState('auto')
  const [extraContext, setExtraContext] = useState('')
  const [showContext, setShowContext] = useState(false)

  const [job, setJob] = useState<DeepProspectJob | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [copied, setCopied] = useState(false)

  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Elapsed timer
  useEffect(() => {
    if (job?.status === 'running' || job?.status === 'pending') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [job?.status])

  // Poll for result
  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/deep-prospect?taskId=${job.taskId}`)
        const data = await res.json()

        if (data.status === 'completed') {
          setJob(prev => prev ? {
            ...prev,
            status: 'completed',
            result: data.result,
            completedAt: new Date().toISOString()
          } : prev)
          saveToHistory({ ...job, status: 'completed', result: data.result, completedAt: new Date().toISOString() })
          if (pollRef.current) clearInterval(pollRef.current)
        } else if (data.status === 'failed') {
          setJob(prev => prev ? { ...prev, status: 'failed' } : prev)
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } catch { /* keep polling */ }
    }, POLL_INTERVAL_MS)

    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [job?.taskId, job?.status])

  const saveToHistory = (j: DeepProspectJob) => {
    try {
      const existing = JSON.parse(localStorage.getItem('dp_history') || '[]') as DeepProspectJob[]
      const updated = [j, ...existing.filter(e => e.id !== j.id)].slice(0, 50)
      localStorage.setItem('dp_history', JSON.stringify(updated))
    } catch { /* ignore */ }
  }

  const handleSubmit = async () => {
    if (!ownerName.trim() || !address.trim()) {
      setError('Owner name and address are required.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setJob(null)
    setElapsed(0)

    try {
      const res = await fetch('/api/deep-prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerName, address, leadType, distressLevel, extraContext: extraContext || undefined })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start task')

      const newJob: DeepProspectJob = {
        id: crypto.randomUUID(),
        taskId: data.taskId,
        ownerName,
        address,
        leadType: leadType as any,
        distressLevel: distressLevel as any,
        extraContext: extraContext || undefined,
        status: 'running',
        createdAt: new Date().toISOString()
      }

      setJob(newJob)
      saveToHistory(newJob)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = () => {
    if (!job?.result) return
    navigator.clipboard.writeText(job.result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Microscope className="w-6 h-6 mr-2 text-violet-600" />
          Deep Prospecting
        </h1>
        <p className="text-gray-600 mt-1">
          AI-powered autonomous research — owner status, heir map, title history, decision maker contact info, and ARV
        </p>
      </div>

      {/* Level Guide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { level: 1, label: 'Surface', desc: 'Owner alive, basic contact', color: 'green' },
          { level: 2, label: 'Title Deep', desc: 'Deed chain, liens, divorce', color: 'yellow' },
          { level: 3, label: 'Deceased', desc: 'Heir map, executor, PR', color: 'orange' },
          { level: 4, label: 'Complex', desc: 'Entity/trust ownership', color: 'red' },
        ].map(l => (
          <div key={l.level} className={`rounded-lg p-3 border ${
            l.color === 'green' ? 'bg-green-50 border-green-200' :
            l.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
            l.color === 'orange' ? 'bg-orange-50 border-orange-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className={`text-xs font-bold mb-0.5 ${
              l.color === 'green' ? 'text-green-700' :
              l.color === 'yellow' ? 'text-yellow-700' :
              l.color === 'orange' ? 'text-orange-700' :
              'text-red-700'
            }`}>Level {l.level} — {l.label}</div>
            <div className="text-xs text-gray-600">{l.desc}</div>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={ownerName}
              onChange={e => setOwnerName(e.target.value)}
              placeholder="e.g. Marwan S. Mubarak"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Property Address <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 1234 Main St, Houston TX 77001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lead Type</label>
            <select
              value={leadType}
              onChange={e => setLeadType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none bg-white text-gray-900"
            >
              {LEAD_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Research Level</label>
            <select
              value={distressLevel}
              onChange={e => setDistressLevel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none bg-white text-gray-900"
            >
              {DISTRESS_LEVEL_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Extra Context Toggle */}
        <button
          onClick={() => setShowContext(!showContext)}
          className="flex items-center text-sm text-violet-600 hover:text-violet-800 mb-3"
        >
          <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${showContext ? 'rotate-180' : ''}`} />
          {showContext ? 'Hide' : 'Add'} extra context (filing text, case number, notes)
        </button>

        {showContext && (
          <textarea
            value={extraContext}
            onChange={e => setExtraContext(e.target.value)}
            placeholder="Paste foreclosure filing, case number, court details, or any other context here..."
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-gray-900 text-sm mb-4"
          />
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || job?.status === 'running' || job?.status === 'pending'}
          className="flex items-center px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" />Starting...</>
          ) : (
            <><Search className="w-5 h-5 mr-2" />Run Deep Prospect</>
          )}
        </button>
      </div>

      {/* Status / Result */}
      {job && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{job.ownerName}</h2>
              <p className="text-sm text-gray-500">{job.address}</p>
            </div>
            <div className="flex items-center gap-3">
              {(job.status === 'running' || job.status === 'pending') && (
                <div className="flex items-center text-violet-600 text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatElapsed(elapsed)}
                </div>
              )}
              {job.status === 'completed' && (
                <span className="flex items-center text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4 mr-1" />Completed
                </span>
              )}
              {job.status === 'failed' && (
                <span className="flex items-center text-red-600 text-sm font-medium">
                  <XCircle className="w-4 h-4 mr-1" />Failed
                </span>
              )}
            </div>
          </div>

          {/* Running state */}
          {(job.status === 'running' || job.status === 'pending') && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
              <p className="text-gray-700 font-medium">Manus is researching...</p>
              <p className="text-gray-400 text-sm mt-1">This typically takes 3–8 minutes. Stay on this page.</p>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-lg text-xs text-center text-gray-500">
                <div className="bg-gray-50 rounded p-2">Searching public records</div>
                <div className="bg-gray-50 rounded p-2">Checking obituaries</div>
                <div className="bg-gray-50 rounded p-2">Tracing deed chain</div>
                <div className="bg-gray-50 rounded p-2">Finding decision maker</div>
              </div>
            </div>
          )}

          {/* Completed result */}
          {job.status === 'completed' && job.result && (
            <div>
              <div className="flex justify-end mb-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center px-3 py-1.5 text-sm bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors"
                >
                  {copied ? <><Check className="w-4 h-4 mr-1" />Copied</> : <><Copy className="w-4 h-4 mr-1" />Copy Report</>}
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                  {job.result}
                </pre>
              </div>
            </div>
          )}

          {/* Failed state */}
          {job.status === 'failed' && (
            <div className="text-center py-8 text-red-600">
              <XCircle className="w-10 h-10 mx-auto mb-3" />
              <p className="font-medium">Research task failed.</p>
              <p className="text-sm text-gray-500 mt-1">Please try again or check your Manus account.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
