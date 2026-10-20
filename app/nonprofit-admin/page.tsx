'use client'
// app/nonprofit-admin/page.tsx
// Nonprofit / AAA / Village Network admin portal
// Allows partner orgs to: register, submit referrals, view their sponsored members, see impact report

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

// ─── Style tokens ─────────────────────────────────────────────────────────────
const navy = '#1a3a5c'
const teal = '#2da89a'
const cream = '#faf9f6'
const warmWhite = '#ffffff'
const warmGrey = '#e8e4dd'
const textSec = '#6b7280'

const card: React.CSSProperties = {
  backgroundColor: warmWhite,
  border: `1px solid ${warmGrey}`,
  borderRadius: '16px',
  padding: '28px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: navy,
  marginBottom: '6px',
  fontFamily: 'system-ui, sans-serif',
}

const input: React.CSSProperties = {
  width: '100%',
  border: `1px solid ${warmGrey}`,
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '15px',
  fontFamily: 'system-ui, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: warmWhite,
  color: navy,
}

const btn = (variant: 'primary' | 'outline' = 'primary'): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 22px',
  borderRadius: '100px',
  fontSize: '14px',
  fontWeight: 700,
  fontFamily: 'system-ui, sans-serif',
  cursor: 'pointer',
  border: variant === 'primary' ? 'none' : `1.5px solid ${navy}`,
  backgroundColor: variant === 'primary' ? teal : 'transparent',
  color: variant === 'primary' ? '#fff' : navy,
})

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'register' | 'referrals' | 'members' | 'impact'

interface Org {
  id: string
  name: string
  org_type: string
  contact_name: string
  contact_email: string
  is_verified: boolean
  total_referrals: number
  active_sponsored_count: number
}

interface Referral {
  id: string
  senior_full_name: string
  senior_phone: string
  tier_requested: string
  reason_for_referral: string
  status: string
  created_at: string
}

interface SponsoredMember {
  id: string
  member_id: string
  tier: string
  status: string
  member_monthly_cost_cents: number
  start_date: string
  renewal_date: string
  members?: { preferred_name: string; full_name: string; phone_number: string }
}

interface ImpactReport {
  org_name: string
  seniors_active: number
  total_seniors_referred: number
  seniors_enrolled: number
  avg_call_completion_rate: number
  avg_mood_score: number
  community_events_attended: number
  total_subsidy_provided_cents: number
}

const ORG_TYPES = [
  { value: 'area_agency_on_aging', label: 'Area Agency on Aging (AAA)' },
  { value: 'village_network', label: 'Village Network' },
  { value: 'senior_center', label: 'Senior Center' },
  { value: 'faith_organization', label: 'Faith Organization' },
  { value: 'community_foundation', label: 'Community Foundation' },
  { value: 'housing_authority', label: 'Housing Authority' },
  { value: 'healthcare_system', label: 'Healthcare System / Hospital' },
  { value: 'other_nonprofit', label: 'Other Nonprofit' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NonprofitAdminPage() {
  const [tab, setTab] = useState<Tab>('register')
  const [org, setOrg] = useState<Org | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [members, setMembers] = useState<SponsoredMember[]>([])
  const [impact, setImpact] = useState<ImpactReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // ── Registration form ──
  const [regForm, setRegForm] = useState({
    name: '', org_type: 'area_agency_on_aging', ein: '',
    contact_name: '', contact_email: '', contact_phone: '',
    address_city: '', address_state: '', website: '',
  })

  // ── Referral form ──
  const [refForm, setRefForm] = useState({
    senior_full_name: '', senior_phone: '', senior_email: '',
    senior_address_city: '', senior_address_state: '', senior_dob_year: '',
    tier_requested: 'community_free', reason_for_referral: '',
    financial_need_confirmed: false,
  })

  // ── Login (look up org by email) ──
  const [loginEmail, setLoginEmail] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/nonprofit/orgs?email=${encodeURIComponent(loginEmail)}`)
      const json = await res.json()
      if (json.orgs && json.orgs.length > 0) {
        const found = json.orgs.find((o: Org) => o.contact_email === loginEmail.toLowerCase())
        if (found) {
          setOrg(found)
          setTab('referrals')
          loadData(found.id)
        } else {
          setError('No organisation found with that email. Please register below.')
        }
      } else {
        setError('No organisation found. Please register below.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async (orgId: string) => {
    try {
      const [refRes, memRes, impRes] = await Promise.all([
        fetch(`/api/nonprofit/referrals?org_id=${orgId}`),
        fetch(`/api/nonprofit/members?org_id=${orgId}`),
        fetch(`/api/nonprofit/impact?org_id=${orgId}`),
      ])
      const [refJson, memJson, impJson] = await Promise.all([
        refRes.json(), memRes.json(), impRes.json(),
      ])
      if (refJson.referrals) setReferrals(refJson.referrals)
      if (memJson.members) setMembers(memJson.members)
      if (impJson.report) setImpact(impJson.report)
    } catch { /* swallow */ }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/nonprofit/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Registration failed'); return }
      setOrg(json.org)
      setSuccess('Organisation registered! A ThriveAtHome team member will verify your account within 1 business day and send you a confirmation email.')
      setTab('referrals')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReferral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!org) return
    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/nonprofit/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...refForm,
          nonprofit_org_id: org.id,
          senior_dob_year: refForm.senior_dob_year ? parseInt(refForm.senior_dob_year) : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Referral submission failed'); return }
      setSuccess(`Referral submitted for ${refForm.senior_full_name}. Our navigator team will call them within 2 business days.`)
      setRefForm({
        senior_full_name: '', senior_phone: '', senior_email: '',
        senior_address_city: '', senior_address_state: '', senior_dob_year: '',
        tier_requested: 'community_free', reason_for_referral: '',
        financial_need_confirmed: false,
      })
      loadData(org.id)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: cream, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{ backgroundColor: navy, padding: '0 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
          <div>
            <Link href="/" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>← ThriveAtHome</Link>
            <h1 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
              Partner Portal
            </h1>
          </div>
          {org && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Signed in as</p>
              <p style={{ margin: 0, color: '#fff', fontWeight: 600, fontSize: '14px' }}>{org.name}</p>
            </div>
          )}
        </div>
      </header>

      {/* Mission band */}
      <div style={{ backgroundColor: teal, padding: '10px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#fff', fontSize: '13.5px', fontWeight: 500 }}>
          ThriveAtHome Community Access Program — Free and subsidised memberships for seniors in need
        </p>
      </div>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Not logged in — show login + register */}
        {!org && (
          <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>

            {/* Sign in */}
            <div style={card}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: navy, margin: '0 0 6px' }}>Already a partner?</h2>
              <p style={{ color: textSec, fontSize: '14px', margin: '0 0 20px' }}>Enter your organisation email to access your dashboard.</p>
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={label}>Organisation email</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    style={input}
                    placeholder="you@yourorg.org"
                  />
                </div>
                {error && <p style={{ color: '#d92f2f', fontSize: '13px', margin: 0 }}>{error}</p>}
                <button type="submit" disabled={loading} style={btn()}>
                  {loading ? 'Looking up…' : 'Access dashboard →'}
                </button>
              </form>
            </div>

            {/* Register */}
            <div style={card}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: navy, margin: '0 0 6px' }}>New partner?</h2>
              <p style={{ color: textSec, fontSize: '14px', margin: '0 0 20px' }}>Register your organisation to start referring seniors to Community Access.</p>
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={label}>Organisation name *</label>
                  <input required value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} style={input} placeholder="Bay Area AAA" />
                </div>
                <div>
                  <label style={label}>Organisation type *</label>
                  <select required value={regForm.org_type} onChange={e => setRegForm({ ...regForm, org_type: e.target.value })} style={{ ...input, height: '42px' }}>
                    {ORG_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={label}>Contact name *</label>
                    <input required value={regForm.contact_name} onChange={e => setRegForm({ ...regForm, contact_name: e.target.value })} style={input} placeholder="Jane Smith" />
                  </div>
                  <div>
                    <label style={label}>Contact email *</label>
                    <input type="email" required value={regForm.contact_email} onChange={e => setRegForm({ ...regForm, contact_email: e.target.value })} style={input} placeholder="jane@org.org" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={label}>Phone</label>
                    <input value={regForm.contact_phone} onChange={e => setRegForm({ ...regForm, contact_phone: e.target.value })} style={input} placeholder="(555) 000-0000" />
                  </div>
                  <div>
                    <label style={label}>EIN (optional)</label>
                    <input value={regForm.ein} onChange={e => setRegForm({ ...regForm, ein: e.target.value })} style={input} placeholder="12-3456789" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={label}>City</label>
                    <input value={regForm.address_city} onChange={e => setRegForm({ ...regForm, address_city: e.target.value })} style={input} placeholder="San Francisco" />
                  </div>
                  <div>
                    <label style={label}>State</label>
                    <input value={regForm.address_state} onChange={e => setRegForm({ ...regForm, address_state: e.target.value })} style={input} placeholder="CA" maxLength={2} />
                  </div>
                </div>
                {success && <p style={{ color: '#1a7a5e', fontSize: '13px', margin: 0, backgroundColor: '#e6f7f3', padding: '10px 14px', borderRadius: '8px' }}>{success}</p>}
                {error && <p style={{ color: '#d92f2f', fontSize: '13px', margin: 0 }}>{error}</p>}
                <button type="submit" disabled={loading} style={btn()}>
                  {loading ? 'Registering…' : 'Register organisation →'}
                </button>
              </form>
            </div>

          </div>
        )}

        {/* Logged in — tabs */}
        {org && (
          <>
            {/* Verification notice */}
            {!org.is_verified && (
              <div style={{ backgroundColor: '#fff7e0', border: '1px solid #f0c84a', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', fontSize: '14px', color: '#7a5500' }}>
                <strong>Pending verification</strong> — Your organisation is under review. Referrals submitted now will be queued and processed once verified (usually within 1 business day).
              </div>
            )}

            {/* Summary tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Active members', value: org.active_sponsored_count, icon: '👥' },
                { label: 'Total referrals', value: org.total_referrals, icon: '📋' },
                { label: 'Avg mood score', value: impact ? `${impact.avg_mood_score}/10` : '—', icon: '😊' },
              ].map(t => (
                <div key={t.label} style={{ ...card, textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>{t.icon}</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: teal }}>{t.value}</div>
                  <div style={{ fontSize: '13px', color: textSec, marginTop: '4px' }}>{t.label}</div>
                </div>
              ))}
            </div>

            {/* Tab nav */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: `2px solid ${warmGrey}`, marginBottom: '28px' }}>
              {([
                { id: 'referrals', label: '+ New referral' },
                { id: 'members', label: `Members (${members.length})` },
                { id: 'impact', label: 'Impact report' },
              ] as { id: Tab; label: string }[]).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: '10px 18px',
                    fontSize: '14px',
                    fontWeight: tab === t.id ? 700 : 500,
                    color: tab === t.id ? teal : textSec,
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    borderBottom: tab === t.id ? `3px solid ${teal}` : '3px solid transparent',
                    marginBottom: '-2px',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── NEW REFERRAL ── */}
            {tab === 'referrals' && (
              <div style={card}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: navy, margin: '0 0 6px' }}>Refer a senior</h2>
                <p style={{ color: textSec, fontSize: '14px', margin: '0 0 24px' }}>
                  Submit a senior for Community Access. Our navigator team will call them within 2 business days to complete intake and onboarding.
                </p>
                <form onSubmit={handleReferral} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={label}>Senior&apos;s full name *</label>
                      <input required value={refForm.senior_full_name} onChange={e => setRefForm({ ...refForm, senior_full_name: e.target.value })} style={input} placeholder="Margaret Johnson" />
                    </div>
                    <div>
                      <label style={label}>Phone number *</label>
                      <input required value={refForm.senior_phone} onChange={e => setRefForm({ ...refForm, senior_phone: e.target.value })} style={input} placeholder="(555) 000-0000" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={label}>Email (optional)</label>
                      <input type="email" value={refForm.senior_email} onChange={e => setRefForm({ ...refForm, senior_email: e.target.value })} style={input} placeholder="margaret@example.com" />
                    </div>
                    <div>
                      <label style={label}>Approx. birth year</label>
                      <input type="number" value={refForm.senior_dob_year} onChange={e => setRefForm({ ...refForm, senior_dob_year: e.target.value })} style={input} placeholder="1948" min={1920} max={2005} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={label}>City</label>
                      <input value={refForm.senior_address_city} onChange={e => setRefForm({ ...refForm, senior_address_city: e.target.value })} style={input} placeholder="Oakland" />
                    </div>
                    <div>
                      <label style={label}>State</label>
                      <input value={refForm.senior_address_state} onChange={e => setRefForm({ ...refForm, senior_address_state: e.target.value })} style={input} placeholder="CA" maxLength={2} />
                    </div>
                  </div>
                  <div>
                    <label style={label}>Membership tier</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {[
                        { value: 'community_free', label: 'Community Free ($0/mo)', desc: 'Fully funded by ThriveAtHome Foundation' },
                        { value: 'community_subsidised', label: 'Community Subsidised ($5/mo)', desc: 'Senior pays $5; foundation covers the rest' },
                      ].map(t => (
                        <label key={t.value} style={{ flex: 1, border: `2px solid ${refForm.tier_requested === t.value ? teal : warmGrey}`, borderRadius: '12px', padding: '14px', cursor: 'pointer', backgroundColor: refForm.tier_requested === t.value ? '#f0fbf9' : warmWhite }}>
                          <input type="radio" name="tier" value={t.value} checked={refForm.tier_requested === t.value} onChange={e => setRefForm({ ...refForm, tier_requested: e.target.value })} style={{ marginRight: '8px' }} />
                          <strong style={{ fontSize: '14px', color: navy }}>{t.label}</strong>
                          <p style={{ margin: '4px 0 0', fontSize: '12px', color: textSec }}>{t.desc}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={label}>Reason for referral *</label>
                    <textarea
                      required
                      rows={4}
                      value={refForm.reason_for_referral}
                      onChange={e => setRefForm({ ...refForm, reason_for_referral: e.target.value })}
                      style={{ ...input, resize: 'vertical', lineHeight: 1.5 }}
                      placeholder="Describe why this senior needs Community Access (e.g. lives alone, isolated, fixed income, recent loss of spouse…)"
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '14px', color: navy }}>
                    <input
                      type="checkbox"
                      checked={refForm.financial_need_confirmed}
                      onChange={e => setRefForm({ ...refForm, financial_need_confirmed: e.target.checked })}
                      style={{ marginTop: '2px', width: '16px', height: '16px', flexShrink: 0 }}
                    />
                    I confirm that this senior has a demonstrated financial need and has consented to being referred to ThriveAtHome Community Access.
                  </label>
                  {success && <p style={{ color: '#1a7a5e', fontSize: '13px', margin: 0, backgroundColor: '#e6f7f3', padding: '12px 16px', borderRadius: '10px' }}>{success}</p>}
                  {error && <p style={{ color: '#d92f2f', fontSize: '13px', margin: 0 }}>{error}</p>}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button type="submit" disabled={loading || !refForm.financial_need_confirmed} style={{ ...btn(), opacity: !refForm.financial_need_confirmed ? 0.5 : 1 }}>
                      {loading ? 'Submitting…' : 'Submit referral →'}
                    </button>
                    <span style={{ fontSize: '13px', color: textSec }}>Navigator calls within 2 business days</span>
                  </div>
                </form>

                {/* Past referrals */}
                {referrals.length > 0 && (
                  <div style={{ marginTop: '32px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: navy, marginBottom: '14px' }}>Your referrals</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {referrals.map(r => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: `1px solid ${warmGrey}`, borderRadius: '10px', backgroundColor: warmWhite, flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: navy }}>{r.senior_full_name}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '13px', color: textSec }}>{r.senior_phone} · {r.tier_requested === 'community_free' ? 'Free' : '$5/mo'}</p>
                          </div>
                          <StatusBadge status={r.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── MEMBERS ── */}
            {tab === 'members' && (
              <div style={card}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: navy, margin: '0 0 6px' }}>Sponsored members</h2>
                <p style={{ color: textSec, fontSize: '14px', margin: '0 0 24px' }}>Seniors your organisation has enrolled in Community Access.</p>
                {members.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: textSec }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
                    <p>No sponsored members yet. Submit your first referral to get started.</p>
                    <button onClick={() => setTab('referrals')} style={btn()}>Refer a senior →</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {members.map(m => (
                      <div key={m.id} style={{ padding: '16px', border: `1px solid ${warmGrey}`, borderRadius: '12px', backgroundColor: warmWhite }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '15px', color: navy }}>
                              {m.members?.preferred_name || m.members?.full_name || 'Member'}
                            </p>
                            <p style={{ margin: '3px 0 0', fontSize: '13px', color: textSec }}>
                              {m.tier === 'community_free' ? 'Community Free ($0/mo)' : 'Community Subsidised ($5/mo)'}
                              {m.start_date && ` · Since ${new Date(m.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                              {m.renewal_date && ` · Renews ${new Date(m.renewal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                            </p>
                          </div>
                          <StatusBadge status={m.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── IMPACT ── */}
            {tab === 'impact' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={card}>
                  <h2 style={{ fontSize: '20px', fontWeight: 600, color: navy, margin: '0 0 4px' }}>Impact report</h2>
                  <p style={{ color: textSec, fontSize: '14px', margin: '0 0 24px' }}>This month&apos;s outcomes for seniors your organisation has sponsored.</p>
                  {!impact ? (
                    <p style={{ color: textSec }}>No impact data yet. Enrol your first senior to start seeing outcomes.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                      {[
                        { label: 'Seniors referred', value: impact.total_seniors_referred, icon: '📋', color: navy },
                        { label: 'Enrolled', value: impact.seniors_enrolled, icon: '✅', color: teal },
                        { label: 'Active this month', value: impact.seniors_active, icon: '💚', color: '#2da85e' },
                        { label: 'Call completion', value: `${impact.avg_call_completion_rate}%`, icon: '📞', color: navy },
                        { label: 'Avg mood score', value: `${impact.avg_mood_score}/10`, icon: '😊', color: teal },
                        { label: 'Events attended', value: impact.community_events_attended, icon: '🎉', color: '#e07b39' },
                      ].map(stat => (
                        <div key={stat.label} style={{ padding: '18px', border: `1px solid ${warmGrey}`, borderRadius: '14px', backgroundColor: warmWhite, textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
                          <div style={{ fontSize: '26px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                          <div style={{ fontSize: '12px', color: textSec, marginTop: '4px', fontWeight: 500 }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* How the program works */}
                <div style={{ ...card, backgroundColor: '#f0fbf9', border: `1px solid ${teal}30` }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: navy, margin: '0 0 14px' }}>How Community Access is funded</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {[
                      { icon: '💳', title: '1% of subscriptions', desc: 'Every ThriveAtHome paid plan automatically contributes 1% to fund Community Access memberships.' },
                      { icon: '🎁', title: 'Donated memberships', desc: 'Members of the public can donate $29–$99/mo to directly fund a specific membership.' },
                      { icon: '🏛️', title: 'ThriveAtHome Foundation', desc: 'Our 501(c)(3) foundation pools donations to sustain long-term Community Access coverage.' },
                    ].map(f => (
                      <div key={f.title}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>{f.icon}</div>
                        <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '14px', color: navy }}>{f.title}</p>
                        <p style={{ margin: 0, fontSize: '13px', color: textSec, lineHeight: 1.5 }}>{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: navy, padding: '24px', textAlign: 'center', marginTop: '60px' }}>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
          ThriveAtHome Partner Portal · Questions? Email{' '}
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>partners@thriveathomenetwork.com</span>
        </p>
      </footer>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    submitted:     { label: 'Submitted', bg: '#e8f0fe', color: '#1a56a0' },
    under_review:  { label: 'Under review', bg: '#fff7e0', color: '#7a5500' },
    approved:      { label: 'Approved', bg: '#e6f7f3', color: '#1a7a5e' },
    enrolled:      { label: 'Enrolled ✓', bg: '#e6f7f3', color: '#1a7a5e' },
    declined:      { label: 'Declined', bg: '#fde8e8', color: '#a02020' },
    active:        { label: 'Active', bg: '#e6f7f3', color: '#1a7a5e' },
    paused:        { label: 'Paused', bg: '#fff7e0', color: '#7a5500' },
    expired:       { label: 'Expired', bg: '#f0f0f0', color: '#666' },
    revoked:       { label: 'Revoked', bg: '#fde8e8', color: '#a02020' },
  }
  const s = map[status] ?? { label: status, bg: '#f0f0f0', color: '#666' }
  return (
    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', backgroundColor: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}
