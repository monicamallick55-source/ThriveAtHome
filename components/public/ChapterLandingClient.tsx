'use client'

import { useState } from 'react'
import type { CommunityOrgRow, OrgProgramRow } from '@/lib/data/communityOrgs'

const PROGRAM_ICONS: Record<string, string> = {
  social: '🤝', transport: '🚗', meals: '🍽️', technology: '💻',
  health: '🩺', education: '📚', advocacy: '📢', home_maintenance: '🔧', general: '⭐',
}

interface Props {
  org: CommunityOrgRow
  programs: OrgProgramRow[]
}

export default function ChapterLandingClient({ org, programs }: Props) {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleContact(e: React.FormEvent) {
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
          message: form.message,
          source: `chapter/${org.slug}`,
          org_name: org.org_name,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setSubmitError(d.error ?? 'Something went wrong. Please try again.')
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
          <a href="/signup" style={{ padding: '8px 18px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}>Get started</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ backgroundColor: 'var(--color-navy)', padding: '56px 32px 64px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
          Local ThriveAtHome Chapter
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 500, color: 'var(--color-cream)', marginBottom: '16px', lineHeight: 1.1 }}>
          {org.org_name}
        </h1>
        {(org.city || org.state) && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
            📍 {org.city}{org.state ? `, ${org.state}` : ''}
          </p>
        )}
        {org.member_count > 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>
            {org.member_count} neighbour{org.member_count !== 1 ? 's' : ''} helping each other thrive
          </p>
        )}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#join" style={{ padding: '14px 32px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}>
            Join this chapter
          </a>
          <a href="/volunteer/apply" style={{ padding: '14px 32px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}>
            Volunteer with us
          </a>
        </div>
      </div>

      <main style={{ maxWidth: '940px', margin: '0 auto', padding: '56px 32px' }}>
        {/* About */}
        {org.description && (
          <section style={{ marginBottom: '56px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>About our chapter</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.75 }}>{org.description}</p>
            {org.service_area_description && (
              <div style={{ marginTop: '20px', padding: '16px 20px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #E8E4DC' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  <strong>Service area:</strong> {org.service_area_description}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Programs */}
        {programs.length > 0 && (
          <section style={{ marginBottom: '56px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Programs & services</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '28px' }}>
              What our chapter offers to members and the community.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {programs.map(p => (
                <div key={p.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC' }}>
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>{PROGRAM_ICONS[p.program_type] ?? '⭐'}</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>{p.program_name}</h3>
                  {p.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '10px' }}>{p.description}</p>}
                  {p.schedule_description && <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-teal)', fontWeight: 500 }}>📅 {p.schedule_description}</p>}
                  {p.volunteers_needed > 0 && (
                    <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#F0F9F7', borderRadius: '6px' }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-teal)', margin: 0 }}>
                        🙋 {p.volunteers_needed - p.volunteers_enrolled} volunteer spot{(p.volunteers_needed - p.volunteers_enrolled) !== 1 ? 's' : ''} open
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Volunteer opportunities */}
        <section style={{ marginBottom: '56px', backgroundColor: '#F0F9F7', borderRadius: '16px', padding: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>Volunteer opportunities</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.65 }}>
            Give a few hours a month. Drive a neighbour to an appointment. Share a meal. Help with tech. Every act of kindness keeps a senior in their home and connected to community.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '28px' }}>
            {['🚗 Rides', '🍲 Meals', '🔧 Home tasks', '💻 Tech help', '🤝 Friendly visits', '📞 Phone check-ins'].map(item => (
              <div key={item} style={{ padding: '16px', backgroundColor: 'white', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', textAlign: 'center' }}>
                {item}
              </div>
            ))}
          </div>
          <a href="/volunteer/apply" style={{ display: 'inline-block', padding: '13px 28px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
            Apply to volunteer
          </a>
        </section>

        {/* Join CTA with contact form */}
        <section id="join" style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Join our chapter</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '32px', lineHeight: 1.65 }}>
            Membership connects you to a network of neighbours who look out for one another. Our sliding-scale dues mean cost is never a barrier.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
            {/* Dues tiers */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>Annual membership</h3>
              {org.dues_description && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px', fontStyle: 'italic', lineHeight: 1.6 }}>{org.dues_description}</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Sliding Scale — Low', cents: org.annual_dues_sliding_low_cents },
                  { label: 'Sliding Scale — Mid', cents: org.annual_dues_sliding_mid_cents },
                  { label: 'Standard', cents: org.annual_dues_standard_cents },
                ].map(tier => (
                  <div key={tier.label} style={{ padding: '16px 20px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #E8E4DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-navy)', fontWeight: 500 }}>{tier.label}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: 'var(--color-teal)' }}>
                      {tier.cents === 0 ? 'Free' : `$${Math.round(tier.cents / 100)}/yr`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact form */}
            <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '28px', border: '1px solid #E8E4DC' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>Send us a message</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>We&rsquo;ll be in touch within 1–2 business days.</p>
              {submitted ? (
                <div style={{ padding: '20px', backgroundColor: '#F0F9F7', borderRadius: '10px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-teal)', marginBottom: '8px' }}>Thank you!</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>We&rsquo;ve received your message and will be in touch soon.</p>
                </div>
              ) : (
                <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {submitError && <div style={{ padding: '10px 14px', backgroundColor: '#FEF3C7', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#78350F' }}>{submitError}</div>}
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Your name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" style={{ width: '100%', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid #D4CFC8', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Email address *</label>
                    <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" style={{ width: '100%', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid #D4CFC8', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Message (optional)</label>
                    <textarea rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us a bit about yourself or ask us anything…" style={{ width: '100%', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid #D4CFC8', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                  </div>
                  <button type="submit" disabled={submitting} style={{ padding: '12px 24px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'white', backgroundColor: submitting ? '#8A9BB5' : 'var(--color-navy)', border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    {submitting ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Footer contact */}
        {(org.contact_email || org.contact_phone || org.website_url) && (
          <section style={{ padding: '28px 32px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E8E4DC' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>Chapter contact</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {org.contact_name && <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}><strong>Contact:</strong> {org.contact_name}</p>}
              {org.contact_email && <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}><strong>Email:</strong> <a href={`mailto:${org.contact_email}`} style={{ color: 'var(--color-teal)', textDecoration: 'none' }}>{org.contact_email}</a></p>}
              {org.contact_phone && <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}><strong>Phone:</strong> {org.contact_phone}</p>}
              {org.website_url && <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}><strong>Website:</strong> <a href={org.website_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-teal)', textDecoration: 'none' }}>{org.website_url}</a></p>}
            </div>
          </section>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '32px', borderTop: '1px solid #E8E4DC', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
        Powered by <a href="/" style={{ color: 'var(--color-teal)', textDecoration: 'none' }}>ThriveAtHome</a> — senior care coordination platform
      </footer>
    </div>
  )
}
