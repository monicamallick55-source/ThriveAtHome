'use client'
// components/achievements/MemberAchievements.tsx
// G5.4 — Member trophy shelf showing earned + locked achievements

import { useState, useEffect } from 'react'

interface AchievementEntry {
  key: string
  title: string
  description: string
  icon: string
  earned: boolean
  awarded_at: string | null
}

export default function MemberAchievements() {
  const [catalog, setCatalog] = useState<AchievementEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all')

  useEffect(() => {
    fetch('/api/achievements')
      .then(r => r.json())
      .then(data => setCatalog(data.catalog ?? []))
      .finally(() => setLoading(false))
  }, [])

  const earned = catalog.filter(a => a.earned)
  const visible = filter === 'earned' ? earned
    : filter === 'locked' ? catalog.filter(a => !a.earned)
    : catalog

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-5 flex items-center gap-5">
        <div className="text-4xl">🏆</div>
        <div>
          <p className="text-2xl font-bold text-indigo-900">{earned.length}</p>
          <p className="text-sm text-indigo-700">
            achievement{earned.length !== 1 ? 's' : ''} earned out of {catalog.length}
          </p>
        </div>
        {earned.length > 0 && (
          <div className="ml-auto flex gap-1 flex-wrap justify-end">
            {earned.slice(0, 6).map(a => (
              <span key={a.key} className="text-2xl" title={a.title}>{a.icon}</span>
            ))}
            {earned.length > 6 && (
              <span className="text-sm text-indigo-500 self-center">+{earned.length - 6}</span>
            )}
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'earned', 'locked'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? `All (${catalog.length})` : f === 'earned' ? `Earned (${earned.length})` : `Locked (${catalog.length - earned.length})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {visible.map(a => (
          <div
            key={a.key}
            className={`rounded-xl border p-4 text-center transition-all ${
              a.earned
                ? 'border-indigo-200 bg-white shadow-sm'
                : 'border-gray-100 bg-gray-50 opacity-50'
            }`}
          >
            <div className={`text-3xl mb-2 ${a.earned ? '' : 'grayscale'}`}>{a.icon}</div>
            <p className={`text-sm font-semibold leading-tight ${a.earned ? 'text-gray-900' : 'text-gray-400'}`}>
              {a.title}
            </p>
            <p className="text-xs text-gray-500 mt-1 leading-snug">{a.description}</p>
            {a.earned && a.awarded_at && (
              <p className="text-xs text-indigo-500 mt-2">
                {new Date(a.awarded_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            )}
            {!a.earned && (
              <p className="text-xs text-gray-400 mt-2">🔒 Not yet earned</p>
            )}
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-6">
          {filter === 'earned' ? 'No achievements earned yet — keep going!' : 'All achievements earned!'}
        </p>
      )}
    </div>
  )
}
