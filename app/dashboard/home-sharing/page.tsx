'use client'

/**
 * app/dashboard/home-sharing/page.tsx — G6.2 Home Sharing
 *
 * Helps members explore home-sharing options:
 *  - As a home provider (spare room)
 *  - As a home seeker (looking for affordable housing)
 *
 * On consent → navigator creates referral to HIP Housing or other active partner.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'intro' | 'interest' | 'safety' | 'consent' | 'submitted' | 'no_partner'

type Referral = {
  id: string
  program_name: string
  program_url?: string
  participation_status: string
  referred_at: string
  participation_updated_at?: string
}

type Partner = {
  id: string
  name: string
  website?: string
  referral_method: string
}

const STATUS_LABELS: Record<string, string> = {
  referred: 'Referral made',
  application_submitted: 'Application submitted',
  enrolled: 'Enrolled',
  completed: 'Completed',
  withdrawn: 'Withdrew',
  not_eligible: 'Not eligible',
}

const STATUS_COLORS: Record<string, string> = {
  referred: '#6366f1',
  application_submitted: '#f59e0b',
  enrolled: '#10b981',
  completed: '#3b82f6',
  withdrawn: '#6b7280',
  not_eligible: '#ef4444',
}

export default function HomeSharingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('intro')
  const [role, setRole] = useState<'provider' | 'seeker' | ''>('')
  const [county, setCounty] = useState('San Mateo')
  const [timeline, setTimeline] = useState('')
  const [hopes, setHopes] = useState('')
  const [concerns, setConcerns] = useState('')
  const [partners, setPartners] = useState<Partner[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [existingLoaded, setExistingLoaded] = useState(false)

  // Load existing referrals on first render
  if (!existingLoaded) {
    setExistingLoaded(true)
    fetch('/api/home-sharing/referrals')
      .then((r) => r.json())
      .then(({ referrals: refs }) => setReferrals(refs ?? []))
      .catch(() => void 0)
  }

  const handleInterestSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/home-sharing/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, county, timeline, hopes, concerns }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.partners?.length === 0) {
        setStep('no_partner')
      } else {
        setPartners(data.partners ?? [])
        setStep('safety')
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelfUpdateStatus = async (referralId: string, status: string) => {
    const res = await fetch(`/api/home-sharing/referrals/${referralId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participation_status: status }),
    })
    if (res.ok) {
      setReferrals((prev) =>
        prev.map((r) => (r.id === referralId ? { ...r, participation_status: status } : r))
      )
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px max(16px, env(safe-area-inset-left, 0px))' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>Home Sharing</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Home sharing can provide companionship, affordable housing, and peace of mind —
        for a home provider or someone looking for a place to live.
      </p>

      {/* Existing referrals */}
      {referrals.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12 }}>Your Home-Sharing Referrals</h2>
          {referrals.map((ref) => (
            <div key={ref.id} style={{
              border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{ref.program_name}</strong>
                <span style={{
                  background: STATUS_COLORS[ref.participation_status] + '20',
                  color: STATUS_COLORS[ref.participation_status],
                  padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600
                }}>
                  {STATUS_LABELS[ref.participation_status] ?? ref.participation_status}
                </span>
              </div>
              {ref.program_url && (
                <a href={ref.program_url} target="_blank" rel="noopener noreferrer"
                   style={{ color: '#6366f1', fontSize: '0.875rem', marginTop: 4, display: 'block' }}>
                  Visit {ref.program_name} ↗
                </a>
              )}
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: 4 }}>
                  Update my status:
                </label>
                <select
                  value={ref.participation_status}
                  onChange={(e) => handleSelfUpdateStatus(ref.id, e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                >
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Step: Intro ───────────────────────────────────────────────── */}
      {step === 'intro' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Provider card */}
            <div
              onClick={() => { setRole('provider'); setStep('interest') }}
              style={{
                border: role === 'provider' ? '2px solid #6366f1' : '1px solid #e5e7eb',
                borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'border 0.15s'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏡</div>
              <h3 style={{ fontWeight: 600, marginBottom: 6 }}>I have a spare room</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                You could earn rental income, get help around the house, or simply enjoy
                some company. We'll help you find the right match safely.
              </p>
            </div>
            {/* Seeker card */}
            <div
              onClick={() => { setRole('seeker'); setStep('interest') }}
              style={{
                border: role === 'seeker' ? '2px solid #6366f1' : '1px solid #e5e7eb',
                borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'border 0.15s'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔑</div>
              <h3 style={{ fontWeight: 600, marginBottom: 6 }}>I need a place to live</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Home sharing can offer affordable housing, with rent or service exchange.
                Professional screening keeps everyone safe.
              </p>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center' }}>
            ThriveAtHome connects you with experienced local home-sharing programs —
            we don't match housemates ourselves.
          </p>
        </div>
      )}

      {/* ── Step: Interest form ───────────────────────────────────────── */}
      {step === 'interest' && (
        <div>
          <button onClick={() => setStep('intro')} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
            ← Back
          </button>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>
            Tell us a bit about what you&apos;re looking for
          </h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>County</label>
            <select value={county} onChange={(e) => setCounty(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}>
              <option>San Mateo</option>
              <option>Santa Clara</option>
              <option>San Francisco</option>
              <option>Alameda</option>
              <option>Marin</option>
              <option>Other</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Timeline</label>
            <select value={timeline} onChange={(e) => setTimeline(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}>
              <option value="">Just exploring</option>
              <option>Within 1–3 months</option>
              <option>Within 6 months</option>
              <option>Within the year</option>
              <option>As soon as possible</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>What are you hoping for? (optional)</label>
            <textarea value={hopes} onChange={(e) => setHopes(e.target.value)} rows={3}
              placeholder={role === 'provider' ? 'e.g. Some help with errands and a bit of company' : 'e.g. A safe, affordable room close to my doctor'}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Any worries or questions? (optional)</label>
            <textarea value={concerns} onChange={(e) => setConcerns(e.target.value)} rows={2}
              placeholder="e.g. How does background checking work?"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
          </div>

          {error && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}
          <button onClick={handleInterestSubmit} disabled={loading}
            style={{ width: '100%', padding: '12px 16px', background: '#6366f1', color: '#fff', borderRadius: 10, border: 'none', cursor: loading ? 'default' : 'pointer', fontWeight: 600, fontSize: '1rem' }}>
            {loading ? 'Finding partners…' : 'Find home-sharing options →'}
          </button>
        </div>
      )}

      {/* ── Step: Safety info ────────────────────────────────────────── */}
      {step === 'safety' && (
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>How home sharing works safely</h2>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>✅ Safety first</p>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, fontSize: '0.9rem' }}>
              <li>The partner programme screens both parties — references, background check, and photo ID</li>
              <li>A family member or your navigator can join any meetings</li>
              <li>Never pay a deposit or share bank details before meeting through the programme</li>
              <li>Your navigator is here if anything ever feels wrong</li>
            </ul>
          </div>

          <p style={{ marginBottom: 20, fontSize: '0.95rem' }}>
            We found <strong>{partners.length} home-sharing programme{partners.length !== 1 ? 's' : ''}</strong> in your area.
            Your navigator will help you with the introduction — no details are shared without your permission.
          </p>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)}
                style={{ marginTop: 2 }} />
              <span style={{ fontSize: '0.9rem' }}>
                I understand that if I proceed, the programme will receive my name and contact details
                to begin the matching process. I can withdraw at any time.
              </span>
            </label>
          </div>

          <button onClick={() => setStep('consent')} disabled={!consentGiven}
            style={{
              width: '100%', padding: '12px 16px',
              background: consentGiven ? '#6366f1' : '#e5e7eb',
              color: consentGiven ? '#fff' : '#9ca3af',
              borderRadius: 10, border: 'none', cursor: consentGiven ? 'pointer' : 'default',
              fontWeight: 600, fontSize: '1rem'
            }}>
            Talk to my navigator →
          </button>
        </div>
      )}

      {/* ── Step: Submitted ───────────────────────────────────────────── */}
      {step === 'consent' && (
        <div style={{ textAlign: 'center', paddingTop: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🤝</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>Your navigator is on it</h2>
          <p style={{ color: '#6b7280', maxWidth: 400, margin: '0 auto 24px' }}>
            We&apos;ve sent a task to your navigator. They&apos;ll reach out soon to walk through your options
            and help with the introduction — at your pace, no pressure.
          </p>
          <button onClick={() => router.push('/dashboard')}
            style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            Back to dashboard
          </button>
        </div>
      )}

      {/* ── Step: No partner ─────────────────────────────────────────── */}
      {step === 'no_partner' && (
        <div style={{ textAlign: 'center', paddingTop: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📍</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>Not in your area yet</h2>
          <p style={{ color: '#6b7280', maxWidth: 400, margin: '0 auto 24px' }}>
            We don&apos;t have a home-sharing partner in <strong>{county}</strong> yet.
            We&apos;ve noted your interest and will reach out when we do.
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: 24 }}>
            In the meantime, your navigator can help you explore other housing options
            or the benefits finder.
          </p>
          <button onClick={() => router.push('/dashboard')}
            style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            Back to dashboard
          </button>
        </div>
      )}
    </div>
  )
}
