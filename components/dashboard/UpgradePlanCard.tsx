'use client'
// components/dashboard/UpgradePlanCard.tsx
// Shown in dashboard when member is on Basics — lets them upgrade to Complete
import { useState } from 'react'
import { Check, Loader2, ArrowUpCircle } from 'lucide-react'

const COMPLETE_EXTRAS = [
  'Volunteer rides & transportation',
  'Meals coordination',
  'Friendly visits & companionship',
  'Tech help at home',
  'Light errands — pharmacy, grocery',
  'Proactive Care Navigator — 2 hrs/month',
  'Services marketplace',
  'Family portal — 8 seats (vs 3)',
]

interface Props {
  currentPlan: 'basics' | 'complete'
  memberName?: string
}

export function UpgradePlanCard({ currentPlan, memberName }: Props) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (currentPlan === 'complete') return null  // nothing to show

  async function handleUpgrade() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPlan: 'complete', targetBilling: billing }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Upgrade failed. Please try again.')
        return
      }
      setSuccess(true)
      // Refresh page after a short delay so the new plan features unlock
      setTimeout(() => window.location.reload(), 2000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ background: '#f0faf4', borderRadius: '16px', padding: '24px', border: '2px solid #52b788', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
        <div style={{ fontWeight: 800, fontSize: '18px', color: '#2d6a4f', marginBottom: '4px' }}>
          You're now on Thrive Complete!
        </div>
        <div style={{ fontSize: '14px', color: '#555' }}>
          Your new features are unlocking now. Refreshing your dashboard…
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #f0faf4 0%, #e8f5e9 100%)', borderRadius: '16px', padding: '24px', border: '2px solid #52b788' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <ArrowUpCircle size={24} color="#2d6a4f" />
        <div style={{ fontWeight: 800, fontSize: '18px', color: '#1a1a1a' }}>
          Upgrade to Thrive Complete
        </div>
      </div>

      {memberName && (
        <p style={{ fontSize: '14px', color: '#555', marginBottom: '12px' }}>
          {memberName}, unlock rides, meals, companionship, and a dedicated Care Navigator — all included.
        </p>
      )}

      <ul style={{ margin: '0 0 16px', padding: '0', listStyle: 'none' }}>
        {COMPLETE_EXTRAS.slice(0, 5).map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', fontSize: '13px', color: '#444' }}>
            <Check size={12} color="#52b788" strokeWidth={3} style={{ flexShrink: 0 }} /> {f}
          </li>
        ))}
      </ul>

      {/* Billing toggle */}
      <div style={{ display: 'flex', background: '#fff', borderRadius: '8px', padding: '3px', marginBottom: '14px', width: 'fit-content', border: '1px solid #c8e6c9' }}>
        {(['monthly', 'annual'] as const).map(b => (
          <button key={b} onClick={() => setBilling(b)} style={{
            padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            background: billing === b ? '#2d6a4f' : 'transparent',
            color: billing === b ? '#fff' : '#555',
            fontWeight: 600, fontSize: '13px', transition: 'all 0.15s',
          }}>
            {b === 'monthly' ? '$79/mo' : '$853/yr (save $95)'}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fff0f0', borderRadius: '8px', color: '#c0392b', fontSize: '13px', marginBottom: '12px', border: '1px solid #ffcccc' }}>
          {error}
        </div>
      )}

      <button onClick={handleUpgrade} disabled={loading} style={{
        width: '100%', padding: '12px', borderRadius: '10px',
        background: loading ? '#ccc' : '#2d6a4f', color: '#fff', border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        transition: 'background 0.2s',
      }}>
        {loading
          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Upgrading…</>
          : <>Upgrade now — {billing === 'annual' ? '$853/yr' : '$79/mo'}</>}
      </button>

      <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '8px' }}>
        Prorated credit applied immediately · Cancel anytime
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
