'use client'
// components/fraud/FamilyScamProtectionCard.tsx
// G7.1 — Family dashboard card: report scam concerns about a loved one

import { useState } from 'react'

const SCAM_TYPES = [
  { value: 'gift_card',               label: '🎁 Gift card demand' },
  { value: 'government_impersonation', label: '🏛️ Government impersonation' },
  { value: 'grandparent',             label: '👴 Grandparent scam' },
  { value: 'romance',                 label: '💔 Romance / online relationship' },
  { value: 'tech_support',            label: '💻 Tech support / virus scare' },
  { value: 'lottery_prize',           label: '🎰 Lottery or prize winnings' },
  { value: 'investment_crypto',       label: '₿ Crypto / investment' },
  { value: 'charity',                 label: '🤲 Charity request' },
  { value: 'large_purchase',          label: '💳 Suspicious large purchase' },
  { value: 'other',                   label: '⚠️ Other suspicious activity' },
]

export default function FamilyScamProtectionCard({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(false)
  const [scamType, setScamType] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [severity, setSeverity] = useState<'concern' | 'urgent'>('concern')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!scamType) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/fraud-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          scamType,
          excerpt: excerpt.slice(0, 200) || undefined,
          severity,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error ?? 'Something went wrong')
      }
      setDone(true)
      setOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{
        background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 10,
        padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <div style={{ fontSize: 24 }}>✅</div>
        <div>
          <div style={{ fontWeight: 700, color: '#065f46' }}>Concern reported</div>
          <div style={{ fontSize: 13, color: '#047857', marginTop: 2 }}>
            A care navigator has been notified and will follow up with your loved one.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <div style={{ fontSize: 22 }}>🛡️</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Scam Protection</div>
          <div style={{ color: '#bfdbfe', fontSize: 12 }}>We monitor calls for fraud patterns automatically</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 18px' }}>
        <p style={{ fontSize: 13, color: '#374151', margin: '0 0 12px' }}>
          Seniors are frequently targeted by scammers. Aria monitors check-in calls for warning signs.
          If you notice anything suspicious, report it here.
        </p>

        {!open ? (
          <button
            onClick={() => setOpen(true)}
            style={{
              padding: '9px 18px', background: '#1d4ed8', color: '#fff',
              border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', width: '100%',
            }}
          >
            Report a scam concern
          </button>
        ) : (
          <form onSubmit={submit}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                What type of scam? *
              </label>
              <select
                required
                value={scamType}
                onChange={(e) => setScamType(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', border: '1px solid #d1d5db',
                  borderRadius: 6, fontSize: 13, background: '#fff',
                }}
              >
                <option value="">Choose type…</option>
                {SCAM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                What did they say or receive? (optional)
              </label>
              <textarea
                rows={2}
                maxLength={200}
                placeholder="e.g. They said someone from the IRS called saying her Social Security number was suspended…"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', border: '1px solid #d1d5db',
                  borderRadius: 6, fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right' }}>{excerpt.length}/200</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                How urgent is this?
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['concern', 'urgent'] as const).map((v) => (
                  <label
                    key={v}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', border: `2px solid ${severity === v ? '#1d4ed8' : '#e5e7eb'}`,
                      borderRadius: 7, cursor: 'pointer', fontSize: 13,
                      background: severity === v ? '#eff6ff' : '#fff',
                    }}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value={v}
                      checked={severity === v}
                      onChange={() => setSeverity(v)}
                      style={{ accentColor: '#1d4ed8' }}
                    />
                    {v === 'concern' ? '🟡 Concerned' : '🔴 Urgent — act now'}
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6,
                padding: '8px 12px', fontSize: 13, color: '#dc2626', marginBottom: 10,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit"
                disabled={loading || !scamType}
                style={{
                  flex: 1, padding: '9px 0', background: severity === 'urgent' ? '#dc2626' : '#1d4ed8',
                  color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer', opacity: !scamType ? 0.5 : 1,
                }}
              >
                {loading ? 'Sending…' : severity === 'urgent' ? '🚨 Report urgently' : 'Report concern'}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null) }}
                style={{
                  padding: '9px 16px', background: '#f3f4f6', border: 'none',
                  borderRadius: 7, fontSize: 13, cursor: 'pointer', color: '#374151',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
