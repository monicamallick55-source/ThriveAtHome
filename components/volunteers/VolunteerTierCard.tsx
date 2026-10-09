'use client'
// components/volunteers/VolunteerTierCard.tsx
// Corporate volunteer program tier progress bar

import { useEffect, useState } from 'react'

interface TierData {
  program: {
    id: string
    name: string
    tier: string
    recognition_badge_url?: string
    employer: { id: string; name: string; slug: string }
  }
  total_hours: number
  tier: string
  hour_target: number
  progress_pct: number
  next_tier: string | null
  next_tier_target: number | null
}

const TIER_COLORS: Record<string, { bg: string; bar: string; badge: string; label: string }> = {
  partner:  { bg: 'bg-blue-50',   bar: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-800',   label: 'Partner'  },
  champion: { bg: 'bg-amber-50',  bar: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-800',  label: 'Champion' },
  leader:   { bg: 'bg-purple-50', bar: 'bg-purple-500', badge: 'bg-purple-100 text-purple-800', label: 'Leader'  },
}

export default function VolunteerTierCard({ programId }: { programId: string }) {
  const [data, setData] = useState<TierData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/employer-admin/volunteer-tier?program_id=${programId}`)
      .then(r => r.json())
      .then(j => { setData(j as TierData); setLoading(false) })
      .catch(() => { setError('Failed to load tier data'); setLoading(false) })
  }, [programId])

  if (loading) return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-full" />
    </div>
  )

  if (error || !data) return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'No data'}</div>
  )

  const colors = TIER_COLORS[data.tier] ?? TIER_COLORS.partner

  return (
    <div className={`rounded-xl border border-gray-200 p-6 shadow-sm ${colors.bg}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Volunteer Tier</p>
          <h3 className="text-lg font-semibold text-gray-900">{data.program.name}</h3>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colors.badge}`}>
          {colors.label}
          {data.program.recognition_badge_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.program.recognition_badge_url} alt="badge" className="ml-1.5 h-4 w-4 rounded-full object-cover" />
          )}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1.5">
          <span>{data.total_hours.toLocaleString()} hrs logged</span>
          <span>Target: {data.hour_target.toLocaleString()} hrs</span>
        </div>
        <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
            style={{ width: `${data.progress_pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1 text-right">{data.progress_pct}% complete</p>
      </div>

      {data.next_tier ? (
        <p className="text-xs text-gray-600">
          <span className="font-medium">{(data.next_tier_target! - data.total_hours).toLocaleString()} hrs</span>
          {" "}to reach <span className="font-medium capitalize">{data.next_tier}</span> tier
        </p>
      ) : (
        <p className="text-xs text-gray-600 font-medium">🎉 Highest tier achieved!</p>
      )}
    </div>
  )
}
