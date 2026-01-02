'use client'

import { STATES } from '@/config/states'
import { MapPin } from 'lucide-react'

interface StateSelectorProps {
  selectedState: string
  onStateChange: (state: string) => void
}

export default function StateSelector({ selectedState, onStateChange }: StateSelectorProps) {
  return (
    <div>
      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
        <MapPin className="inline w-4 h-4 mr-1" />
        Select State
      </label>
      <select
        id="state"
        value={selectedState}
        onChange={(e) => onStateChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors bg-white text-gray-900"
      >
        <option value="" className="text-gray-500">-- Choose a state --</option>
        {STATES.map((state) => (
          <option key={state.code} value={state.code} className="text-gray-900 bg-white py-2">
            {state.name} ({state.type === 'statewide' ? 'Statewide' : `${state.counties?.length || 0} Counties`})
          </option>
        ))}
      </select>
      {selectedState && (
        <p className="mt-2 text-sm text-gray-600">
          {STATES.find(s => s.code === selectedState)?.type === 'statewide' 
            ? '✓ Statewide coverage available'
            : `✓ ${STATES.find(s => s.code === selectedState)?.counties?.length || 0} counties available`
          }
        </p>
      )}
    </div>
  )
}
