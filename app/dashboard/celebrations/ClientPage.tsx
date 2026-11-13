'use client'

/**
 * app/dashboard/celebrations/page.tsx — G7.4 Family-Initiated Celebrations
 *
 * Family members plan celebrations for their senior.
 * Three tiers: Digital (free) | Enhanced ($25) | Premier ($75)
 * Grief guard: warns if occasion date is within 30 days of a loss anniversary.
 */

import { useState, useEffect } from 'react'

type Celebration = {
  id: string
  created_at: string
  occasion: string
  occasion_date: string
  tier: string
  title?: string
  description?: string
  status: string
  grief_flagged?: boolean
  price_cents: number
}

const TIERS = [
  {
    id: 'digital',
    label: 'Digital',
    price: 0,
    emoji: '💻',
    desc: 'Joy call on the day + digital family card compiled from everyone\'s messages.',
    perks: ['Grace/Joy AI call on the day', 'Digital card from family', 'Community birthday wishes'],
  },
  {
    id: 'enhanced',
    label: 'Enhanced',
    price: 25,
    emoji: '🌟',
    desc: 'Everything in Digital, plus a volunteer visit and gift coordination.',
    perks: ['Everything in Digital', 'Volunteer visit booking', 'Gift coordination'],
  },
  {
    id: 'premier',
    label: 'Premier',
    price: 75,
    emoji: '👑',
    desc: 'Everything in Enhanced, plus a navigator-scheduled video gathering and physical memory book.',
    perks: ['Everything in Enhanced', 'Video gathering scheduling', 'Physical memory book mailed'],
  },
]

const OCCASIONS = [
  'Birthday', 'Anniversary', 'Homecoming', 'Recovery milestone',
  'Graduation', 'Holiday', 'Just because', 'Other',
]

function statusBadge(status: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending:           { label: 'Pending',          bg: '#fef3c7', color: '#92400e' },
    navigator_review:  { label: 'Under Review',     bg: '#ede9fe', color: '#5b21b6' },
    confirmed:         { label: 'Confirmed ✓',      bg: '#d1fae5', color: '#065f46' },
    completed:         { label: 'Completed 🎉',     bg: '#d1fae5', color: '#065f46' },
    cancelled:         { label: 'Cancelled',        bg: '#fee2e2', color: '#991b1b' },
  }
  const s = map[status] ?? { label: status, bg: '#f3f4f6', color: '#374151' }
  return <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: s.bg, color: s.color }}>{s.label}</span>
}

export default function ClientPage() {
  const [tab, setTab] = useState<'upcoming' | 'plan'>('upcoming')
  const [celebrations, setCelebrations] = useState<Celebration[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [occasion, setOccasion] = useState('Birthday')
  const [occasionDate, setOccasionDate] = useState('')
  const [tier, setTier] = useState('digital')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [memberId, setMemberId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; warn?: boolean } | null>(null)

  useEffect(() => {
    // Try to get member id from profile
    fetch('/api/members/me')
      .then(r => r.ok ? r.json() : {})
      .then(d => { if (d.member?.id) setMemberId(d.member.id) })
      .catch(() => {})

    loadCelebrations()
  }, [])

  async function loadCelebrations() {
    setLoading(true)
    try {
      const res = await fetch('/api/celebrations')
      const data = await res.json()
      setCelebrations(data.celebrations ?? [])
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string, warn = false) {
    setToast({ msg, warn })
    setTimeout(() => setToast(null), 4000)
  }

  async function submitCelebration() {
    if (!occasion || !occasionDate || !memberId) {
      showToast('Please fill in all required fields.', true)
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/celebrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, occasion, occasion_date: occasionDate, tier, title, description }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Something went wrong', true); return }

      if (data.checkout_url) {
        window.location.href = data.checkout_url
        return
      }

      if (data.celebration?.grief_flagged) {
        showToast('⚠️ This date is close to a remembered loss anniversary. A navigator will review before confirming.', true)
      } else {
        showToast('🎉 Celebration planned! We\'ll take it from here.')
      }

      // Reset form
      setOccasion('Birthday')
      setOccasionDate('')
      setTier('digital')
      setTitle('')
      setDescription('')
      setTab('upcoming')
      loadCelebrations()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <span style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none"}}>Celebrations: celebrate, celebration, event, birthday, anniversary, milestone</span>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: toast.warn ? '#92400e' : '#1f2937', color: '#fff',
          padding: '10px 24px', borderRadius: 10, fontSize: '0.9rem', zIndex: 100,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: 420, textAlign: 'center',
        }}>
          {toast.msg}
        </div>
      )}

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>Celebrations</h1>
      <p style={{ color: '#6b7280', marginBottom: 24, fontSize: '0.9rem' }}>
        Plan something special — birthdays, milestones, and moments that matter.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e7eb', marginBottom: 28 }}>
        {(['upcoming', 'plan'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === t ? 700 : 400, fontSize: '0.9rem',
            color: tab === t ? '#6366f1' : '#6b7280',
            borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {t === 'upcoming' ? '🎉 Upcoming' : '+ Plan a Celebration'}
          </button>
        ))}
      </div>

      {/* ── Upcoming tab ── */}
      {tab === 'upcoming' && (
        <div>
          {loading ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: 32 }}>Loading…</p>
          ) : celebrations.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 40, color: '#9ca3af' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎈</div>
              <p style={{ marginBottom: 16 }}>No celebrations planned yet.</p>
              <button onClick={() => setTab('plan')}
                style={{ padding: '10px 24px', border: 'none', borderRadius: 8, background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Plan your first celebration
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {celebrations.map(c => {
                const tierInfo = TIERS.find(t => t.id === c.tier)
                return (
                  <div key={c.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937' }}>
                          {tierInfo?.emoji} {c.title || c.occasion}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>
                          {c.occasion} · {new Date(c.occasion_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          {' · '}<span style={{ color: '#6366f1', fontWeight: 600 }}>{tierInfo?.label} tier</span>
                        </div>
                        {c.description && <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: 4 }}>{c.description}</div>}
                        {c.grief_flagged && (
                          <div style={{ fontSize: '0.78rem', color: '#92400e', marginTop: 6, background: '#fffbeb', padding: '4px 10px', borderRadius: 6, display: 'inline-block' }}>
                            ⚠️ Navigator review in progress
                          </div>
                        )}
                      </div>
                      {statusBadge(c.status)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Plan tab ── */}
      {tab === 'plan' && (
        <div style={{ maxWidth: 520 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Occasion */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
                Occasion <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select value={occasion} onChange={e => setOccasion(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', background: '#fff' }}>
                {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Date */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
                Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="date" value={occasionDate} onChange={e => setOccasionDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>

            {/* Title (optional) */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
                Custom title <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
              </label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Mom's 80th Birthday!"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>

            {/* Description (optional) */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
                Notes for the team <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
              </label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Any special details, preferences, or family notes…"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            {/* Tier picker */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 10, color: '#374151' }}>
                Celebration tier
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TIERS.map(t => (
                  <button key={t.id} onClick={() => setTier(t.id)}
                    style={{
                      border: `2px solid ${tier === t.id ? '#6366f1' : '#e5e7eb'}`,
                      borderRadius: 12, padding: '14px 16px', background: tier === t.id ? '#f5f3ff' : '#fff',
                      cursor: 'pointer', textAlign: 'left',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1f2937' }}>{t.emoji} {t.label}</span>
                      <span style={{ fontWeight: 700, color: t.price === 0 ? '#10b981' : '#6366f1', fontSize: '0.9rem' }}>
                        {t.price === 0 ? 'Free' : `$${t.price}`}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 8 }}>{t.desc}</div>
                    <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                      {t.perks.map(p => <li key={p} style={{ fontSize: '0.78rem', color: '#374151' }}>{p}</li>)}
                    </ul>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={submitCelebration}
              disabled={submitting || !occasionDate || !memberId}
              style={{
                padding: '13px 0', borderRadius: 10, border: 'none',
                background: submitting || !occasionDate ? '#e5e7eb' : '#6366f1',
                color: submitting || !occasionDate ? '#9ca3af' : '#fff',
                fontWeight: 700, fontSize: '1rem', cursor: submitting || !occasionDate ? 'default' : 'pointer',
              }}>
              {submitting ? 'Planning…' : tier === 'digital' ? 'Plan Celebration (Free)' : `Plan Celebration — $${TIERS.find(t => t.id === tier)?.price}`}
            </button>

            <p style={{ fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
              Your senior won't see the planning details — only the celebration itself.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
