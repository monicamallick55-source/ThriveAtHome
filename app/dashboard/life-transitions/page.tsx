'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const PATHWAYS = [
  { id: 'widow', label: 'Loss of Spouse/Partner', icon: '💔' },
  { id: 'loss', label: 'Loss of Loved One', icon: '🕯️' },
  { id: 'retirement', label: 'Retirement', icon: '🌅' },
  { id: 'move', label: 'Moving/Downsizing', icon: '🏠' },
  { id: 'health', label: 'Health Change', icon: '❤️' },
  { id: 'caregiver', label: 'Becoming a Caregiver', icon: '🤝' },
]

export default function LifeTransitionsPage() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Life Transitions</h1>
      <p className="text-gray-600 mb-6">Select your situation and we'll create a personalized support plan.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {PATHWAYS.map(p => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`flex items-center gap-3 p-4 border rounded-lg text-left transition ${selected === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
          >
            <span className="text-2xl">{p.icon}</span>
            <span className="font-medium">{p.label}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="font-semibold mb-2">Your Support Plan</h2>
          <p className="text-sm text-gray-600">We're here to support you through this transition. Your care navigator will reach out within 24 hours.</p>
          <Link href="/dashboard/trusted-advisors" className="mt-3 inline-block text-blue-600 underline text-sm">Browse Trusted Advisors →</Link>
        </div>
      )}
    </main>
  )
}
