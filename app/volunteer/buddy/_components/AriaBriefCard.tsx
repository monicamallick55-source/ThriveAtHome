'use client'
import { useState } from 'react'

export default function AriaBriefCard({ memberId, memberName }: { memberId: string; memberName: string }) {
  const [brief, setBrief] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [shown, setShown] = useState(false)

  const loadBrief = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/buddy/brief?memberId=${memberId}`)
      const data = await res.json()
      setBrief(data.briefText)
      setShown(true)
    } catch {
      setBrief('Unable to load brief right now. Trust your instincts — you know them well.')
      setShown(true)
    } finally {
      setLoading(false)
    }
  }

  if (!shown) {
    return (
      <button onClick={loadBrief} disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-[#2A9D8F] text-white rounded-lg text-sm font-medium hover:bg-[#248a7e] disabled:opacity-50 transition">
        <span>{loading ? '⏳' : '🌟'}</span>
        {loading ? 'Loading brief…' : `Prepare for call with ${memberName}`}
      </button>
    )
  }

  return (
    <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-teal-600">🌟</span>
        <span className="text-sm font-semibold text-teal-800">Before you call {memberName}</span>
      </div>
      <p className="text-sm text-teal-900 leading-relaxed">{brief}</p>
      <p className="text-xs text-teal-600 mt-2">From Aria's recent check-ins · Just for you</p>
    </div>
  )
}
