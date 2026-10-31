"use client"

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const ORG_TYPE_LABELS: Record<string, string> = {
  village_network: 'Village to Village Network',
  area_agency_on_aging: 'Area Agency on Aging',
  senior_center: 'Senior Center',
  nonprofit: 'Nonprofit / Community Foundation',
  faith_community: 'Faith Community',
  other: 'Other Organization',
}

function EnrollForm() {
  const router = useRouter()
  const params = useSearchParams()
  const cancelled = params.get('cancelled') === '1'
  const typeParam = params.get('type') ?? ''
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    orgName: '', orgType: typeParam, contactName: '', contactEmail: '',
    contactPhone: '', city: '', state: '', website: '', orgSize: '', missionStatement: '',
  })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.orgType === 'nonprofit') { router.push('/nonprofit-admin'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/org-enroll/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
      if (data.redirect) { router.push(data.redirect); return }
      if (data.checkoutUrl) { window.location.href = data.checkoutUrl; return }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  const inp: React.CSSProperties = { width: '100%', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '11px 14px', fontSize: '15px', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white', color: 'var(--color-navy)' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px', fontFamily: 'var(--font-body)' }
  const fld: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
  const isNonprofit = form.orgType === 'nonprofit'
  const feeLabel = form.orgType ? (isNonprofit ? '✓ Free — no enrollment fee' : '💳 $3,300 one-time enrollment fee') : ''

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500, textDecoration: 'none' }}>ThriveAtHome</Link>
        <Link href="/for-organizations" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Back to organizations</Link>
      </nav>
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px', lineHeight: 1.2 }}>Enroll your organization</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Nonprofits join free. Other organization types pay a one-time $3,300 enrollment fee.
          </p>
        </div>
        {cancelled && (
          <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px', fontFamily: 'var(--font-body)', fontSize: '15px', color: '#856404' }}>
            Payment cancelled. Fill out the form again whenever you are ready.
          </div>
        )}
        <div style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '36px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={fld}>
              <label style={lbl}>Organization type *</label>
              <select value={form.orgType} onChange={set('orgType')} required style={inp}>
                <option value="">Select type…</option>
                {Object.entries(ORG_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              {feeLabel && <p style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600, color: isNonprofit ? 'var(--color-teal)' : 'var(--color-navy)', fontFamily: 'var(--font-body)' }}>{feeLabel}</p>}
            </div>
            <div style={fld}>
              <label style={lbl}>Organization name *</label>
              <input value={form.orgName} onChange={set('orgName')} required placeholder="Village of Oak Park" style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={fld}><label style={lbl}>Contact name *</label><input value={form.contactName} onChange={set('contactName')} required placeholder="Jane Smith" style={inp} /></div>
              <div style={fld}><label style={lbl}>Contact email *</label><input type="email" value={form.contactEmail} onChange={set('contactEmail')} required placeholder="jane@village.org" style={inp} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={fld}><label style={lbl}>Phone</label><input type="tel" value={form.contactPhone} onChange={set('contactPhone')} placeholder="(312) 555-0100" style={inp} /></div>
              <div style={fld}><label style={lbl}>Website</label><input type="url" value={form.website} onChange={set('website')} placeholder="https://yourvillage.org" style={inp} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '16px' }}>
              <div style={fld}><label style={lbl}>City</label><input value={form.city} onChange={set('city')} placeholder="Chicago" style={inp} /></div>
              <div style={fld}><label style={lbl}>State</label><input value={form.state} onChange={set('state')} placeholder="IL" maxLength={2} style={inp} /></div>
              <div style={fld}>
                <label style={lbl}>Members</label>
                <select value={form.orgSize} onChange={set('orgSize')} style={inp}>
                  <option value="">Any</option>
                  {['1-50','51-200','201-500','501-1000','1000+'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={fld}>
              <label style={lbl}>Mission statement</label>
              <textarea value={form.missionStatement} onChange={set('missionStatement')} placeholder="Briefly describe your mission and the seniors you serve…" rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
            </div>
            {error && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 18px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#b91c1c' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ backgroundColor: loading ? '#94a3b8' : 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '12px', padding: '15px 28px', fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-body)', cursor: loading ? 'not-allowed' : 'pointer', width: '100%' }}>
              {loading ? 'Redirecting to payment…' : isNonprofit ? 'Continue to nonprofit portal →' : form.orgType ? 'Proceed to payment ($3,300) →' : 'Continue →'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', margin: 0 }}>
              🔒 Payments processed securely by Stripe. Questions? <Link href="/contact" style={{ color: 'var(--color-teal)', textDecoration: 'none' }}>Contact us</Link>.
            </p>
          </form>
        </div>
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[['What does the $3,300 fee cover?','Platform setup, dedicated onboarding, your first year of admin portal access, and a dedicated navigator contact.'],['Are there ongoing fees?','Annual renewal fees apply after year one, discussed during your onboarding call.'],['How long until our portal is active?','Within 3 business days of payment. Most orgs go live within 24 hours.']].map(([q,a]) => (
            <div key={q} style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px 24px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 6px' }}>{q}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>{a}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default function OrgEnrollPage() {
  return <Suspense><EnrollForm /></Suspense>
}
