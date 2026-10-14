// app/admin/campaigns/page.tsx
// G6.4 Community Care Fund — Admin overview
'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Campaign {
  id: string
  title: string
  need_category: string
  goal_amount_cents: number | null
  status: string
  member_consent: boolean
  total_pledged_cents: number
  total_confirmed_cents: number
  created_at: string
  deadline: string | null
  members: { first_name: string; last_name: string }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:           { label: 'Draft',           color: 'bg-amber-100 text-amber-800' },
  consent_pending: { label: 'Consent pending', color: 'bg-blue-100 text-blue-800' },
  active:          { label: 'Active',          color: 'bg-green-100 text-green-800' },
  fulfilled:       { label: 'Fulfilled',       color: 'bg-teal-100 text-teal-800' },
  closed:          { label: 'Closed',          color: 'bg-gray-100 text-gray-500' },
  withdrawn:       { label: 'Withdrawn',       color: 'bg-gray-100 text-gray-400' },
}

export default function AdminCampaignsPage() {
  const supabase = createClientComponentClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('member_campaigns')
        .select('*, members(first_name, last_name)')
        .order('created_at', { ascending: false })
      if (data) setCampaigns(data)
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (cents: number) =>
    `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`

  const filtered = filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter)

  // Stats
  const totalPledged   = campaigns.reduce((a, c) => a + c.total_pledged_cents, 0)
  const totalConfirmed = campaigns.reduce((a, c) => a + c.total_confirmed_cents, 0)
  const activeCount    = campaigns.filter(c => c.status === 'active').length
  const fulfilledCount = campaigns.filter(c => c.status === 'fulfilled').length

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Community Care Fund — Admin</h1>
      <p className="text-sm text-gray-500 mb-8">Overview of all member campaigns and contributions.</p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { n: fmt(totalConfirmed), label: 'Total confirmed' },
          { n: fmt(totalPledged),   label: 'Total pledged' },
          { n: activeCount,         label: 'Active campaigns' },
          { n: fulfilledCount,      label: 'Fulfilled' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{s.n}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'draft', 'consent_pending', 'active', 'fulfilled', 'closed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              filter === f
                ? 'bg-teal-600 border-teal-600 text-white'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_LABELS[f]?.label ?? f}
            {f === 'all' && ` (${campaigns.length})`}
            {f !== 'all' && ` (${campaigns.filter(c => c.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Member</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Campaign</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Goal</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Confirmed</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Pledged</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                    No campaigns found.
                  </td>
                </tr>
              ) : filtered.map(c => {
                const s = STATUS_LABELS[c.status] ?? { label: c.status, color: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap">
                      {c.members.first_name} {c.members.last_name}
                    </td>
                    <td className="px-5 py-3 text-gray-900 font-medium max-w-xs truncate">{c.title}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-gray-600">
                      {c.goal_amount_cents ? fmt(c.goal_amount_cents) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-green-700">
                      {c.total_confirmed_cents ? fmt(c.total_confirmed_cents) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-gray-500">
                      {c.total_pledged_cents ? fmt(c.total_pledged_cents) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {c.deadline ? new Date(c.deadline).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
