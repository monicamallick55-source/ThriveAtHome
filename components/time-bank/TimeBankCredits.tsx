'use client'
// components/time-bank/TimeBankCredits.tsx
// Family reciprocity time-bank credits display for members + family

import { useEffect, useState } from 'react'

interface Credit {
  id: string
  created_at: string
  credits: number
  hours_served: number
  service_type: string
  redeemed_at: string | null
  note: string | null
  earner: { id: string; member: { full_name: string; preferred_name: string | null } } | null
  beneficiary: { id: string; full_name: string; preferred_name: string | null } | null
  performed_for: { id: string; full_name: string; preferred_name: string | null } | null
}

function displayName(m: { full_name: string; preferred_name: string | null } | null) {
  if (!m) return 'Unknown'
  return m.preferred_name ?? m.full_name
}

export default function TimeBankCredits({ memberId }: { memberId?: string }) {
  const [credits, setCredits] = useState<Credit[]>([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const url = memberId
      ? `/api/time-bank?member_id=${memberId}`
      : '/api/time-bank'
    fetch(url)
      .then(r => r.json())
      .then((j: { credits: Credit[]; balance: number; error?: string }) => {
        if (j.error) { setError(j.error); setLoading(false); return }
        setCredits(j.credits ?? [])
        setBalance(j.balance ?? 0)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load credits'); setLoading(false) })
  }, [memberId])

  if (loading) return (
    <div className="space-y-3 animate-pulse">
      {[1,2,3].map(i => (
        <div key={i} className="h-16 rounded-xl bg-gray-100" />
      ))}
    </div>
  )

  if (error) return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
  )

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-md">
        <p className="text-sm font-medium text-emerald-100 mb-1">Available Time-Bank Credits</p>
        <p className="text-4xl font-bold">{balance.toLocaleString()}</p>
        <p className="text-xs text-emerald-200 mt-1">1 credit = 1 hour of care received</p>
      </div>

      {credits.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500 text-sm">No time-bank credits yet.</p>
          <p className="text-gray-400 text-xs mt-1">
            Family members earn credits by volunteering for other seniors.
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Credit History</h3>
          <div className="space-y-2">
            {credits.map(c => (
              <div
                key={c.id}
                className={`rounded-xl border p-4 ${c.redeemed_at ? 'border-gray-200 bg-gray-50 opacity-70' : 'border-emerald-200 bg-emerald-50'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.redeemed_at ? 'bg-gray-200 text-gray-600' : 'bg-emerald-100 text-emerald-800'}`}>
                        {c.redeemed_at ? 'Redeemed' : `+${c.credits} credit${c.credits !== 1 ? 's' : ''}`}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1">
                      <span className="font-medium">
                        {c.earner ? displayName(c.earner.member) : 'Family member'}
                      </span>
                      {" volunteered "}
                      <span className="font-medium">{c.hours_served}h</span>
                      {" of "}
                      <span className="font-medium">{c.service_type}</span>
                      {c.performed_for && (
                        <> for <span className="font-medium">{displayName(c.performed_for)}</span></>
                      )}
                    </p>
                    {c.note && (
                      <p className="text-xs text-gray-500 mt-0.5 italic">{c.note}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
