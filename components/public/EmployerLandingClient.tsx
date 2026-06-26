'use client'

import { useState } from 'react'

interface Employer {
  id: string
  company_name: string
  slug: string | null
  description: string | null
  website_url: string | null
  benefit_headline: string | null
  benefit_description: string | null
  plan_tier: string
  contact_email: string
  contact_name: string
}

interface Props {
  employer: Employer
}

const BENEFIT_FEATURES = [
  { icon: '📞', title: 'Daily check-in calls', desc: 'AI-powered calls keep your senior connected and flags concerns early.' },
  { icon: '🚗', title: 'Volunteer services', desc: 'Rides, meals, home tasks, tech help — all coordinated for you.' },
  { icon: '🧭', title: 'Dedicated navigator', desc: 'A human navigator guides your family through every care decision.' },
  { icon: '🏥', title: 'Care coordination', desc: 'Telehealth, medication tracking, referrals to specialists.' },
  { icon: '🤝', title: 'Community connection', desc: 'Cultural circles, classes, and events to reduce isolation.' },
  { icon: '📋', title: 'Family dashboard', desc: 'Real-time visibility into your loved one\'s wellbeing from anywhere.' },
]

export default function EmployerLandingClient({ employer }: Props) {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const headline = employer.benefit_headline ?? `${employer.company_name} cares about your whole family`
  const tierLabel = employer.plan_tier === 'professional' ? 'Professional' : employer.plan_tier === 'enterprise' ? 'Enterprise' : 'Essentials'

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/contact/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message || `Employee requesting enrollment in ${employer.company_name} ThriveAtHome benefit.`,
          source: `employer/${employer.slug}`,
          org_name: employer.company_name,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setSubmitError(d.error ?? 'Something went wrong.')
        return
      }
      setSubmitted(true)
    } catch {
      setSubmitError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500, textDecoration: 'none' }}>ThriveAtHome</a>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/login" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontFamily: 'var(--font-body)', textDecoration: 'none' }}>Sign in</a>
          <a href="#enroll" style={{ padding: '8px 18px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}>Enroll now</a>
        </div>
      </nav>

      {/* Partner badge */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E8E4DC', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)' }}>{employer.company_name}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>×</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--color-teal)', fontWeight: 500 }}>ThriveAtHome</span>
        <span style={{ padding: '3px 10px', backgroundColor: '#E8F5F2', borderRadius: '20px', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--color-teal)' }}>
          {tierLabel} benefit
        </span>
      </div>

      {/* Hero */}
      <div style={{ padding: '64px 32px', textAlign: 'center', maxWidth: '760px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px', lineHeight: 1.1 }}>
          {headline}
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '36px' }}>
          {employer.benefit_description ?? `${employer.company_name} provides ThriveAtHome as a fully-paid employee benefit. Enroll your aging parent or loved one today — no extra cost to you.`}
        </p>
        <a href="#enroll" style={{ display: 'inline-block', padding: '16px 40px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: '12px', fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 600, textDecoration: 'none' }}>
          Enroll your family member
        </a>
      </div>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '0 32px 64px' }}>
        {/* Benefits grid */}
        <section style={{ marginBottom: '64px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', textAlign: 'center', marginBottom: '40px' }}>
            What your family gets
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {BENEFIT_FEATURES.map(f => (
              <div key={f.title} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section style={{ marginBottom: '64px', backgroundColor: 'var(--color-navy)', borderRadius: '20px', padding: '48px 40px', color: 'white' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-cream)', marginBottom: '32px', textAlign: 'center' }}>How it works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
            {[
              { step: '1', title: 'You enroll', desc: 'Fill out the short form below with your work email.' },
              { step: '2', title: 'We reach out', desc: 'A ThriveAtHome navigator calls to learn about your family situation.' },
              { step: '3', title: 'Setup in 24 hrs', desc: 'Your loved one is enrolled, check-ins begin, dashboard goes live.' },
              { step: '4', title: 'Peace of mind', desc: 'You get alerts, call summaries, and human support when it matters.' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: 'white' }}>{s.step}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-cream)', marginBottom: '8px' }}>{s.title}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Enroll form */}
        <section id="enroll">
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px', textAlign: 'center' }}>Get started today</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '32px', lineHeight: 1.65, textAlign: 'center' }}>
              This benefit is paid for by {employer.company_name}. Use your work email so we can verify your eligibility.
            </p>
            <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '32px', border: '1px solid #E8E4DC' }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>You&rsquo;re on the list!</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                    A ThriveAtHome navigator will reach out within 1 business day to get your family enrolled.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEnroll} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {submitError && <div style={{ padding: '10px 14px', backgroundColor: '#FEF3C7', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#78350F' }}>{submitError}</div>}
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Your name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" style={{ width: '100%', padding: '11px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid #D4CFC8', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Work email address *</label>
                    <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@yourcompany.com" style={{ width: '100%', padding: '11px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid #D4CFC8', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Tell us about your situation (optional)</label>
                    <textarea rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="e.g. My mom is 78 and lives alone in Phoenix. She's mostly independent but I worry about falls…" style={{ width: '100%', padding: '11px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid #D4CFC8', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                  </div>
                  <button type="submit" disabled={submitting} style={{ padding: '13px 24px', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'white', backgroundColor: submitting ? '#8A9BB5' : 'var(--color-teal)', border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    {submitting ? 'Sending…' : 'Request enrollment'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer style={{ textAlign: 'center', padding: '32px', borderTop: '1px solid #E8E4DC', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
        Powered by <a href="/" style={{ color: 'var(--color-teal)', textDecoration: 'none' }}>ThriveAtHome</a> — a benefit provided by {employer.company_name}
      </footer>
    </div>
  )
}
