'use client'

import { useState } from 'react'
import Link from 'next/link'

const COMPANY_SIZES = [
  '1–50 employees',
  '51–200 employees',
  '201–500 employees',
  '501–1,000 employees',
  '1,001–5,000 employees',
  '5,000+ employees',
]

const VALUE_PROPS = [
  {
    icon: '📞',
    title: 'Daily AI check-ins',
    desc: 'Friendly phone calls keep your employees\' parents connected and safe — no smartphone required.',
  },
  {
    icon: '🔔',
    title: 'Real-time family alerts',
    desc: 'If something changes in a senior\'s wellbeing, the family hears about it immediately.',
  },
  {
    icon: '🤝',
    title: 'Care navigator support',
    desc: 'A dedicated human navigator coordinates care, volunteers, and community connections.',
  },
  {
    icon: '📊',
    title: 'Outcomes reporting',
    desc: 'Aggregate, anonymised dashboards show the impact of your eldercare benefit — no individual data shared.',
  },
]

export default function EmployersPage() {
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    company_size: '',
    notes: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/employers/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const json = await res.json()
        setErrorMsg(json.error || 'Something went wrong.')
        setStatus('error')
        return
      }
      setStatus('success')
    } catch {
      setErrorMsg('Network error — please try again.')
      setStatus('error')
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        backgroundColor: 'var(--color-navy)',
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', textDecoration: 'none', fontWeight: 500 }}>
          ThriveAtHome
        </Link>
        <Link href="/login" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(250,250,245,0.75)', textDecoration: 'none' }}>
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--color-navy) 0%, #1a3a5c 100%)',
        padding: '72px 32px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-teal)', marginBottom: '16px' }}>
            Employer Eldercare Benefit
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 500, color: 'var(--color-cream)', marginBottom: '20px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Your employees are caring for aging parents. We help.
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'rgba(250,250,245,0.8)', lineHeight: 1.65, marginBottom: '40px' }}>
            ThriveAtHome is an eldercare benefit that gives employees peace of mind — and gives their parents daily connection, safety monitoring, and a human care team.
          </p>
          <a
            href="#demo-form"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--color-navy)',
              backgroundColor: 'var(--color-cream)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 32px',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
          >
            Request a demo →
          </a>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ backgroundColor: 'white', borderBottom: '1px solid var(--color-warm-grey)', padding: '32px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', textAlign: 'center' }}>
          {[
            { stat: '73%', label: 'of caregivers say eldercare stress affects their work' },
            { stat: '5 hrs/wk', label: 'average time employees spend on aging parent logistics' },
            { stat: '$33B', label: 'annual cost of caregiver absenteeism to U.S. employers' },
          ].map(({ stat, label }) => (
            <div key={stat}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>{stat}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Value props */}
      <section style={{ padding: '72px 32px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', textAlign: 'center', marginBottom: '48px' }}>
            What your employees get
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {VALUE_PROPS.map(({ icon, title, desc }) => (
              <div key={title} style={{
                backgroundColor: 'white',
                border: '1px solid var(--color-warm-grey)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start',
              }}>
                <div style={{ fontSize: '32px', flexShrink: 0 }}>{icon}</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>{title}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Volunteer Program — dual benefit section */}
      <section style={{ backgroundColor: 'var(--color-navy)', padding: '72px 32px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-teal)', marginBottom: '12px', textAlign: 'center' }}>
            Two employer benefits. One partnership.
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 500, color: 'var(--color-cream)', textAlign: 'center', marginBottom: '16px', lineHeight: 1.2 }}>
            Give your team purpose <em>and</em> peace of mind
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(250,250,245,0.75)', textAlign: 'center', marginBottom: '56px', lineHeight: 1.7, maxWidth: '640px', margin: '0 auto 56px' }}>
            ThriveAtHome offers employers two distinct programmes — the eldercare subscription benefit for caregiving employees, and a Corporate Volunteer Program for employees who want to give back.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
            {/* Benefit 1: Eldercare subscription */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '36px' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>💚</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-cream)', marginBottom: '12px' }}>
                Eldercare Subscription Benefit
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(250,250,245,0.75)', lineHeight: 1.7, marginBottom: '24px' }}>
                For employees who are caring for aging parents. ThriveAtHome keeps their loved one safe, connected, and supported — so employees can be fully present at work.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Daily AI check-in calls for the senior', 'Real-time safety alerts for the family', 'Human care navigator on call', 'Volunteer companions and community circles'].map(item => (
                  <li key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(250,250,245,0.8)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--color-teal)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(250,250,245,0.5)', marginTop: '20px', marginBottom: 0 }}>
                PEPM pricing · from $15/employee/month · billed from your HR benefits budget
              </p>
            </div>

            {/* Benefit 2: Corporate Volunteer Program */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '36px' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🤝</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-cream)', marginBottom: '12px' }}>
                Corporate Volunteer Program
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(250,250,245,0.75)', lineHeight: 1.7, marginBottom: '24px' }}>
                For employees who want to give back. They volunteer time with seniors on ThriveAtHome. Your company matches their hours with a cash donation — tracked and exported automatically to Benevity, YourCause, or Bright Funds.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Volunteer hours tracked automatically', 'Benevity / YourCause / Bright Funds export', 'Real impact: seniors matched with employee volunteers', 'Flexible matching rates ($10–$25/hr typical)'].map(item => (
                  <li key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(250,250,245,0.8)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--color-teal)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(250,250,245,0.5)', marginTop: '20px', marginBottom: 0 }}>
                Annual programme fee · from $5K/year · billed from your CSR / giving budget
              </p>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(250,250,245,0.6)', marginTop: '36px' }}>
            Programmes can be purchased independently or bundled together. Ask us about combined pricing.
          </p>
        </div>
      </section>

      {/* Pricing tiers */}
      <section style={{ backgroundColor: 'white', padding: '64px 32px' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>
            Simple, transparent pricing
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', marginBottom: '40px' }}>
            Per-employee-per-month (PEPM) pricing. Contact us for volume rates and custom plans.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'left' }}>
            {[
              { tier: 'Essentials', price: '$8/mo', features: ['Daily AI check-ins', 'Family dashboard', 'Real-time alerts'] },
              { tier: 'Connect', price: '$15/mo', features: ['Everything in Essentials', 'Care navigator access', 'Community circles', 'Events & skill exchange'], highlight: true },
              { tier: 'Complete', price: '$25/mo', features: ['Everything in Connect', 'Transport & meal booking', 'Life story archive', 'Grief support circles'] },
            ].map(({ tier, price, features, highlight }) => (
              <div key={tier} style={{
                border: highlight ? '2px solid var(--color-teal)' : '1px solid var(--color-warm-grey)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                position: 'relative',
              }}>
                {highlight && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--color-teal)', color: 'white', fontSize: '12px', fontWeight: 600, padding: '2px 12px', borderRadius: '99px', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
                    Most popular
                  </div>
                )}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '4px' }}>{tier}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '20px' }}>{price} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--color-text-secondary)' }}>per employee</span></div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {features.map(f => (
                    <li key={f} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: 'var(--color-teal)', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo request form */}
      <section id="demo-form" style={{ padding: '72px 32px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px', textAlign: 'center' }}>
            Request a demo
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', marginBottom: '40px', textAlign: 'center', lineHeight: 1.6 }}>
            We&apos;ll reach out within one business day to schedule a personalized walkthrough.
          </p>

          {status === 'success' ? (
            <div style={{
              backgroundColor: '#f0faf5',
              border: '1.5px solid var(--color-teal)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>
                Request received!
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                Thanks, <strong>{form.contact_name}</strong>. We&apos;ll be in touch within one business day to schedule your demo.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>
                    Company name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    name="company_name"
                    type="text"
                    required
                    value={form.company_name}
                    onChange={handleChange}
                    placeholder="Acme Corp"
                    style={{ width: '100%', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-sm)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>
                    Your name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    name="contact_name"
                    type="text"
                    required
                    value={form.contact_name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    style={{ width: '100%', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-sm)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>
                    Work email <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane@company.com"
                    style={{ width: '100%', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-sm)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>
                    Phone
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(555) 555-0100"
                    style={{ width: '100%', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-sm)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>
                  Company size
                </label>
                <select
                  name="company_size"
                  value={form.company_size}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-sm)', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' }}
                >
                  <option value="">Select company size</option>
                  {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>
                  Anything else you&apos;d like us to know?
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Current benefits, timeline, number of employees with elder care responsibilities..."
                  style={{ width: '100%', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-sm)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {status === 'error' && (
                <div style={{ backgroundColor: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#dc2626' }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                style={{
                  padding: '14px 32px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '17px',
                  fontWeight: 600,
                  color: 'white',
                  backgroundColor: status === 'submitting' ? 'var(--color-text-secondary)' : 'var(--color-navy)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  minHeight: '52px',
                }}
              >
                {status === 'submitting' ? 'Sending...' : 'Request a demo →'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--color-warm-grey)', padding: '24px 32px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Home</Link>
        <Link href="/pricing" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Individual pricing</Link>
        <Link href="/privacy" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Privacy</Link>
      </footer>
    </div>
  )
}
