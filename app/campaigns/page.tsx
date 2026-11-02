'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const CATEGORIES = ['all','health','community','education','arts','environment','seniors','other']

interface Campaign {
  id: string; title: string; description: string; cause_category: string
  goal_amount: number; raised_amount: number; donor_count: number
  cover_image_url: string | null; end_date: string | null
  stripe_payment_link_url: string | null
  members: { first_name: string; last_name: string }
}

function ProgressBar({ raised, goal }: { raised: number; goal: number }) {
  const pct = Math.min(100, Math.round((raised / goal) * 100))
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
      <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = category === 'all' ? '/api/campaigns' : `/api/campaigns?category=${category}`
    fetch(url).then(r => r.json()).then(d => { setCampaigns(Array.isArray(d) ? d : []); setLoading(false) })
  }, [category])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Member Campaigns</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Fundraising causes started by our community</p>
        </div>
        <Link href="/campaigns/new" className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 text-sm">+ Start a Campaign</Link>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {cat}
          </button>
        ))}
      </div>
      {loading ? <div className="text-center py-20 text-gray-400">Loading campaigns…</div>
      : campaigns.length === 0 ? <div className="text-center py-20 text-gray-400">No campaigns yet. Be the first!</div>
      : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(c => (
            <Link key={c.id} href={`/campaigns/${c.id}`} className="group block">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {c.cover_image_url
                  ? <img src={c.cover_image_url} alt={c.title} className="w-full h-40 object-cover" />
                  : <div className="w-full h-40 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center"><span className="text-4xl">🎗️</span></div>}
                <div className="p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">{c.cause_category}</span>
                  <h2 className="mt-2 font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 transition-colors">{c.title}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">by {c.members.first_name} {c.members.last_name}</p>
                  <ProgressBar raised={c.raised_amount} goal={c.goal_amount} />
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">${c.raised_amount.toLocaleString()} raised</span>
                    <span className="text-gray-400">of ${c.goal_amount.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{c.donor_count} donor{c.donor_count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
