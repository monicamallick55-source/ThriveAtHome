'use client'
// G7.10 — Surfaces retired attorney/CPA/financial-advisor volunteers in the Legal/Financial Hub

import { useEffect, useState } from 'react'

type RetiredPro = {
  id: string; first_name: string; last_initial: string
  specialty: string; specialty_label: string; specialty_emoji: string
  location: string | null; total_hours: number; bio: string | null
}

export default function RetiredProsSection() {
  const [pros, setPros] = useState<RetiredPro[]>([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/volunteers/retired-pros?specialty=attorney,cpa,financial')
      .then(r => r.ok ? r.json() : { pros: [] })
      .then(d => setPros(d.pros ?? []))
      .catch(() => setPros([]))
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  async function requestConsult(pro: RetiredPro) {
    setRequesting(pro.id)
    try {
      const res = await fetch('/api/navigator-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: 'professional_referral', priority: 'medium',
          description: `Member requests consultation with retired ${pro.specialty_label} volunteer ${pro.first_name} ${pro.last_initial}.`,
          metadata: { volunteer_id: pro.id, specialty: pro.specialty, hub: 'Legal/Financial' },
        }),
      })
      if (res.ok) {
        setSent(prev => new Set([...prev, pro.id]))
        showToast(`✅ Request sent! Your navigator will arrange a consultation with ${pro.first_name}.`)
      } else {
        const e = await res.json()
        showToast(e.error ?? 'Could not send request')
      }
    } finally { setRequesting(null) }
  }

  if (loading || pros.length === 0) return null

  return (
    <div style={{ marginTop: 32 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: '#fff', padding: '10px 24px', borderRadius: 10, fontSize: '0.9rem', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: 420, textAlign: 'center' }}>
          {toast}
        </div>
      )}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 28 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
          💼 Free Consultations from Retired Professionals
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 18 }}>
          Experienced volunteer attorneys, accountants, and financial advisors who generously donate their expertise. All consultations are free and arranged through your navigator.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {pros.map(pro => {
            const isSent = sent.has(pro.id)
            const isRequesting = requesting === pro.id
            return (
              <div key={pro.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1f2937' }}>{pro.specialty_emoji} {pro.first_name} {pro.last_initial}.</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>Retired {pro.specialty_label}{pro.location ? ` · ${pro.location}` : ''}</div>
                    {pro.total_hours > 0 && <div style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 600, marginTop: 2 }}>{pro.total_hours.toFixed(0)}h donated</div>}
                  </div>
                  <span style={{ fontSize: '0.68rem', background: '#f0fdf4', color: '#065f46', padding: '2px 8px', borderRadius: 99, fontWeight: 700, flexShrink: 0 }}>Free</span>
                </div>
                {pro.bio && <p style={{ fontSize: '0.8rem', color: '#374151', marginBottom: 10, lineHeight: 1.5 }}>{pro.bio}</p>}
                <button onClick={() => !isSent && requestConsult(pro)} disabled={isSent || isRequesting}
                  style={{ width: '100%', padding: '8px', border: 'none', borderRadius: 8, background: isSent ? '#d1fae5' : isRequesting ? '#e5e7eb' : '#6366f1', color: isSent ? '#065f46' : isRequesting ? '#9ca3af' : '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: isSent || isRequesting ? 'default' : 'pointer' }}>
                  {isSent ? '✓ Request Sent' : isRequesting ? 'Sending…' : 'Request Free Consultation'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
