'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

const LANGUAGES = ['English', 'Spanish', 'Mandarin', 'Cantonese', 'Vietnamese', 'Korean', 'Tagalog', 'Hindi', 'Arabic', 'Portuguese', 'Russian', 'Polish', 'Other']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const HOURS_OPTIONS = ['1–2 hours', '3–5 hours', '5–10 hours', '10+ hours']
const SERVICE_TYPES = [
  { value: 'phone_call', label: 'Phone call companion' },
  { value: 'in_person_visit', label: 'In-person visit' },
  { value: 'virtual_event', label: 'Virtual events' },
  { value: 'grocery_help', label: 'Grocery help' },
  { value: 'walking_companion', label: 'Walking companion' },
  { value: 'reading_aloud', label: 'Reading aloud' },
  { value: 'tech_help', label: 'Tech help' },
]
const INTERESTS = [
  'Cooking & recipes', 'Music & singing', 'Sports & fitness', 'Arts & crafts',
  'Travel & history', 'Books & reading', 'Gardening & nature', 'Movies & TV',
  'Faith & spirituality', 'Family & grandchildren', 'Health & wellness', 'Community & civic life',
]
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

type FormState = {
  full_name: string
  email: string
  phone: string
  city: string
  state: string
  languages: string[]
  availability_days: string[]
  hours_per_week: string
  service_types: string[]
  interests: string[]
  why_volunteer: string
  prior_experience: string
  is_veteran: boolean
  veteran_branch: string
  veteran_years: string
  vso_affiliation: string
}

const initial: FormState = {
  full_name: '', email: '', phone: '', city: '', state: '',
  languages: [], availability_days: [], hours_per_week: '',
  service_types: [], interests: [], why_volunteer: '', prior_experience: '',
  is_veteran: false, veteran_branch: '', veteran_years: '', vso_affiliation: '',
}

function toggleItem(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
}

export default function VolunteerApplyPage() {
  const [form, setForm] = useState<FormState>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.full_name.trim() || !form.email.trim() || !form.why_volunteer.trim()) {
      setError('Please complete all required fields (name, email, motivation).')
      return
    }
    setSubmitting(true)
    try {
      const interests = [...form.interests]
      if (form.is_veteran) interests.push('veteran')
      const res = await fetch('/api/volunteer/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          interests,
          veteran_branch: form.is_veteran ? form.veteran_branch : undefined,
          veteran_years: form.is_veteran ? form.veteran_years : undefined,
          vso_affiliation: form.is_veteran ? form.vso_affiliation : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const navStyle: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 40,
    backgroundColor: 'white',
    borderBottom: '1px solid var(--color-warm-grey)',
    boxShadow: 'var(--shadow-sm)',
    height: '64px', display: 'flex', alignItems: 'center',
  }
  const navInner: React.CSSProperties = {
    maxWidth: '800px', margin: '0 auto', padding: '0 24px', width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }
  const sectionStyle: React.CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid var(--color-warm-grey)',
    borderRadius: 'var(--radius-lg)',
    padding: '32px',
    marginBottom: '24px',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--color-navy)',
    marginBottom: '6px',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '56px',
    padding: '0 16px',
    border: '1.5px solid var(--color-warm-grey)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)',
    fontSize: '18px',
    color: 'var(--color-text)',
    backgroundColor: 'white',
    outline: 'none',
    boxSizing: 'border-box',
  }
  const pillStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '999px',
    border: `1.5px solid ${active ? 'var(--color-teal)' : 'var(--color-warm-grey)'}`,
    backgroundColor: active ? 'var(--color-teal)' : 'white',
    color: active ? 'white' : 'var(--color-text)',
    fontFamily: 'var(--font-body)',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    userSelect: 'none',
  })

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
        <nav style={navStyle}>
          <div style={navInner}>
            <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', textDecoration: 'none', fontWeight: 500 }}>ThriveAtHome</Link>
          </div>
        </nav>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 24px' }}>
          <div style={{ maxWidth: '520px', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--color-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>✓</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: 'var(--color-navy)', marginBottom: '16px', fontWeight: 500 }}>Application received!</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
              Thank you for applying to volunteer with ThriveAtHome. Our team will review your application and reach out within 2–3 business days.
            </p>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '56px', padding: '0 32px', backgroundColor: 'var(--color-navy)', color: 'white', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '17px', fontWeight: 500, textDecoration: 'none' }}>
              Return to home
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={navStyle}>
        <div style={navInner}>
          <Link href="/" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>← Back to home</Link>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500 }}>ThriveAtHome</span>
          <div style={{ width: '120px' }} />
        </div>
      </nav>

      <main style={{ flex: 1, maxWidth: '800px', margin: '0 auto', padding: '48px 24px', width: '100%' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px', letterSpacing: '-0.01em' }}>
            Become a volunteer
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
            Join our volunteer network and make a real difference in a senior&apos;s life. All volunteers undergo a background check before their first visit.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* Personal info */}
          <div style={sectionStyle}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--color-navy)', fontWeight: 500, marginBottom: '24px' }}>Personal information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle} htmlFor="vol-name">Full name <span style={{ color: 'var(--color-urgent-text)' }}>*</span></label>
                <input id="vol-name" type="text" style={inputStyle} value={form.full_name}
                  onChange={e => setField('full_name', e.target.value)} placeholder="Your full name" required />
              </div>
              <div>
                <label style={labelStyle} htmlFor="vol-email">Email address <span style={{ color: 'var(--color-urgent-text)' }}>*</span></label>
                <input id="vol-email" type="email" style={inputStyle} value={form.email}
                  onChange={e => setField('email', e.target.value)} placeholder="your@email.com" required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle} htmlFor="vol-phone">Phone number</label>
                <input id="vol-phone" type="tel" style={inputStyle} value={form.phone}
                  onChange={e => setField('phone', e.target.value)} placeholder="(555) 555-5555" />
              </div>
              <div>
                <label style={labelStyle} htmlFor="vol-city">City</label>
                <input id="vol-city" type="text" style={inputStyle} value={form.city}
                  onChange={e => setField('city', e.target.value)} placeholder="City" />
              </div>
              <div>
                <label style={labelStyle} htmlFor="vol-state">State</label>
                <select id="vol-state" style={{ ...inputStyle, cursor: 'pointer' }} value={form.state}
                  onChange={e => setField('state', e.target.value)}>
                  <option value="">Select state</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Veteran toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <button type="button"
                onClick={() => setField('is_veteran', !form.is_veteran)}
                style={{ width: '48px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', backgroundColor: form.is_veteran ? 'var(--color-teal)' : 'var(--color-warm-grey)' }}
                aria-label="Are you a veteran?"
              >
                <span style={{ position: 'absolute', top: '4px', left: form.is_veteran ? '24px' : '4px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s' }} />
              </button>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text)', fontWeight: 500 }}>I am a U.S. military veteran</span>
            </div>

            {form.is_veteran && (
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-warm-grey)' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Thank you for your service. Veteran volunteers can be matched with veteran seniors for peer connection.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle} htmlFor="vet-branch">Branch of service</label>
                    <input id="vet-branch" type="text" style={inputStyle} value={form.veteran_branch}
                      onChange={e => setField('veteran_branch', e.target.value)} placeholder="e.g. Army, Navy" />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="vet-years">Years served</label>
                    <input id="vet-years" type="text" style={inputStyle} value={form.veteran_years}
                      onChange={e => setField('veteran_years', e.target.value)} placeholder="e.g. 2001–2007" />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="vet-vso">VSO affiliation (optional)</label>
                    <input id="vet-vso" type="text" style={inputStyle} value={form.vso_affiliation}
                      onChange={e => setField('vso_affiliation', e.target.value)} placeholder="e.g. VFW, DAV" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Languages */}
          <div style={sectionStyle}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--color-navy)', fontWeight: 500, marginBottom: '8px' }}>Languages spoken</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>Select all languages you can use comfortably.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {LANGUAGES.map(lang => (
                <button key={lang} type="button" onClick={() => setField('languages', toggleItem(form.languages, lang))} style={pillStyle(form.languages.includes(lang))} aria-pressed={form.languages.includes(lang)}>
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div style={sectionStyle}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--color-navy)', fontWeight: 500, marginBottom: '8px' }}>Availability</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>When are you generally available to volunteer?</p>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '12px' }}>Days of the week</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {DAYS.map(day => (
                  <button key={day} type="button" onClick={() => setField('availability_days', toggleItem(form.availability_days, day))} style={pillStyle(form.availability_days.includes(day))} aria-pressed={form.availability_days.includes(day)}>
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle} htmlFor="vol-hours">Hours available per week</label>
              <select id="vol-hours" style={{ ...inputStyle, width: '240px', cursor: 'pointer' }} value={form.hours_per_week} onChange={e => setField('hours_per_week', e.target.value)}>
                <option value="">Select hours</option>
                {HOURS_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {/* Service types */}
          <div style={sectionStyle}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--color-navy)', fontWeight: 500, marginBottom: '8px' }}>Types of support</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>What kinds of visits are you comfortable doing? Select all that apply.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {SERVICE_TYPES.map(st => (
                <button key={st.value} type="button" onClick={() => setField('service_types', toggleItem(form.service_types, st.value))} style={pillStyle(form.service_types.includes(st.value))} aria-pressed={form.service_types.includes(st.value)}>
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div style={sectionStyle}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--color-navy)', fontWeight: 500, marginBottom: '8px' }}>Your interests</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>Shared interests help us match you with seniors you&apos;ll connect with naturally.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {INTERESTS.map(interest => (
                <button key={interest} type="button" onClick={() => setField('interests', toggleItem(form.interests, interest))} style={pillStyle(form.interests.includes(interest))} aria-pressed={form.interests.includes(interest)}>
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Motivation */}
          <div style={sectionStyle}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--color-navy)', fontWeight: 500, marginBottom: '8px' }}>Your motivation</h2>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle} htmlFor="vol-why">Why do you want to volunteer with ThriveAtHome? <span style={{ color: 'var(--color-urgent-text)' }}>*</span></label>
              <textarea id="vol-why" style={{ ...inputStyle, height: '140px', padding: '16px', resize: 'vertical' as const, lineHeight: 1.6 }}
                value={form.why_volunteer} onChange={e => setField('why_volunteer', e.target.value)}
                placeholder="Tell us what motivates you to support seniors in your community..." required />
            </div>
            <div>
              <label style={labelStyle} htmlFor="vol-exp">Prior experience with seniors <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span></label>
              <textarea id="vol-exp" style={{ ...inputStyle, height: '112px', padding: '16px', resize: 'vertical' as const, lineHeight: 1.6 }}
                value={form.prior_experience} onChange={e => setField('prior_experience', e.target.value)}
                placeholder="Any previous caregiving, volunteering, or professional experience with older adults..." />
            </div>
          </div>

          {error && (
            <div style={{ padding: '16px 20px', backgroundColor: '#FFF0F0', border: '1.5px solid var(--color-urgent-border)', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-urgent-text)' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '48px' }}>
            <Link href="/" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Cancel</Link>
            <button type="submit" disabled={submitting}
              style={{ height: '56px', padding: '0 40px', backgroundColor: submitting ? 'var(--color-warm-grey)' : 'var(--color-navy)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
