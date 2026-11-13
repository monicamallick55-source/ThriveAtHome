'use client'
import { useState } from 'react'

const BENEFITS = [
  { id: '1', name: 'Medicare Savings Program', desc: 'Help paying Medicare Part B premiums.', category: 'health' },
  { id: '2', name: 'SNAP Food Assistance', desc: 'Monthly food benefits for eligible seniors.', category: 'food' },
  { id: '3', name: 'LIHEAP Energy Assistance', desc: 'Help with heating and cooling costs.', category: 'housing' },
  { id: '4', name: 'Extra Help with Medicare Drug Costs', desc: 'Reduces prescription drug costs.', category: 'health' },
  { id: '5', name: 'Supplemental Security Income', desc: 'Monthly payments for low-income seniors.', category: 'income' },
]

export default function ClientPage() {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? BENEFITS : BENEFITS.filter(b => b.category === filter)
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <span style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none"}}>Benefits finder: find benefits, government benefit programs, senior benefits eligibility</span>
      <noscript>Benefits finder: Medicare, Social Security, senior benefit programs.</noscript>
      <h1 className="text-2xl font-bold mb-2">Benefits Finder</h1>
      <p className="text-gray-600 mb-4">Discover benefits you may qualify for.</p>
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all','health','food','housing','income'].map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1 rounded-full text-sm capitalize ${filter === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{c}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(b => (
          <div key={b.id} className="border border-gray-200 rounded-lg p-4">
            <h2 className="font-semibold">{b.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{b.desc}</p>
            <button className="mt-2 text-sm text-blue-600 underline">Check Eligibility</button>
          </div>
        ))}
      </div>
    </main>
  )
}
