'use client'
// Advisor listing application form — public (Phase 98, M24).
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ADVISOR_TYPES, LISTING_TIERS } from '@/lib/advisors/types'

const field: React.CSSProperties = {
  width: '100%',
  minHeight: '52px',
  borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--color-warm-grey)',
  padding: '12px 14px',
  fontFamily: 'var(--font-body)',
  fontSize: '16px',
  boxSizing: 'border-box',
  backgroundColor: 'white',
}
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  margin: '0 0 6px',
}

export default function AdvisorApplyClient() {
  const [form, setForm] = useState({
    full_name: '',
    firm_name: '',
    advisor_type: '',
    email: '',
    phone: '',
    credentials: '',
    service_areas: '',
    years_experience: '',
    requested_tier: 'standard',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.full_name.trim() || !form.email.trim() || !form.advisor_type) {
      setError('Please fill in your name, email, and advisor type.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/advisors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) setError(json.error ?? 'Something went wrong. Please try again.')
      else setDone(true)
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div style={{ backgroundColor: 'var(--color-teal-muted)', borderRadius: 'var(--radius-lg)', padding: '24px', fontFamily: 'var(--font-body)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', margin: '0 0 8px' }}>
          Thank you — your application is in.
        </h2>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Our partnerships team will review your credentials and reach out within 5 business days.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={labelStyle} htmlFor="a-name">Full name *</label>
        <input id="a-name" style={field} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="a-firm">Firm or practice name</label>
        <input id="a-firm" style={field} value={form.firm_name} onChange={(e) => set('firm_name', e.target.value)} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="a-type">Type of advisor *</label>
        <select id="a-type" style={field} value={form.advisor_type} onChange={(e) => set('advisor_type', e.target.value)}>
          <option value="">Choose one…</option>
          {ADVISOR_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div>
          <label style={labelStyle} htmlFor="a-email">Email *</label>
          <input id="a-email" type="email" style={field} value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="a-phone">Phone</label>
          <input id="a-phone" style={field} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
      </div>
      <div>
        <label style={labelStyle} htmlFor="a-cred">Credentials &amp; licenses</label>
        <input id="a-cred" style={field} placeholder="e.g. J.D., CELA, admitted CA Bar 2004" value={form.credentials} onChange={(e) => set('credentials', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div>
          <label style={labelStyle} htmlFor="a-areas">Service areas (cities / states)</label>
          <input id="a-areas" style={field} value={form.service_areas} onChange={(e) => set('service_areas', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="a-years">Years of experience</label>
          <input id="a-years" style={field} value={form.years_experience} onChange={(e) => set('years_experience', e.target.value)} />
        </div>
      </div>
      <div>
        <label style={labelStyle} htmlFor="a-tier">Listing tier you are interested in</label>
        <select id="a-tier" style={field} value={form.requested_tier} onChange={(e) => set('requested_tier', e.target.value)}>
          {LISTING_TIERS.map((t) => (
            <option key={t.value} value={t.value}>{t.label} — ${t.annualFee.toLocaleString()}/year</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle} htmlFor="a-msg">Anything else we should know?</label>
        <textarea id="a-msg" rows={4} style={{ ...field, minHeight: '96px' }} value={form.message} onChange={(e) => set('message', e.target.value)} />
      </div>

      {error && (
        <p role="alert" style={{ color: 'var(--color-concern-text)', backgroundColor: 'var(--color-concern)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: '14px', margin: 0 }}>
          ⚠ {error}
        </p>
      )}
      <Button type="submit" loading={submitting}>Submit application</Button>
    </form>
  )
}
