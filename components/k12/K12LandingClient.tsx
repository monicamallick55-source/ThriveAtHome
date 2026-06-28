'use client'
import { useState } from 'react'

const PROGRAMS = [
  {
    id: 'pen_pals',
    icon: '✉️',
    title: 'Pen Pals',
    age: 'Ages 8–18',
    description: 'Students write regular letters or emails to a matched senior, building a meaningful friendship across generations.',
    benefits: ['Improves student writing skills', 'Reduces senior isolation', '10–15 min per week'],
    color: '#EEF2FF',
    border: '#C7D2FE',
    text: '#3730A3',
  },
  {
    id: 'life_stories',
    icon: '📖',
    title: 'Life Stories Project',
    age: 'Ages 12–18',
    description: 'Students interview seniors and write or record their life stories — creating a lasting legacy while learning oral history.',
    benefits: ['Semester-long project', 'Social studies curriculum credit', 'Published in ThriveAtHome Life Story Archive'],
    color: '#FFF7ED',
    border: '#FED7AA',
    text: '#9A3412',
  },
  {
    id: 'mentorship_reversal',
    icon: '🤝',
    title: 'Mentorship Reversal',
    age: 'Ages 14–18',
    description: 'Students teach seniors a skill — from smartphone basics to social media — while seniors mentor students in return.',
    benefits: ['High school service hours eligible', 'Tech confidence for seniors', 'Life wisdom for students'],
    color: '#F0FDF4',
    border: '#BBF7D0',
    text: '#166534',
  },
]

const SCHOOL_TYPES = [
  { value: 'elementary', label: 'Elementary School (K–5)' },
  { value: 'middle', label: 'Middle School (6–8)' },
  { value: 'high_school', label: 'High School (9–12)' },
  { value: 'k12_combined', label: 'K–12 Combined School' },
]

export function K12LandingClient() {
  const [showRegForm, setShowRegForm] = useState(false)
  const [form, setForm] = useState({
    school_name: '', contact_name: '', contact_email: '',
    school_type: 'high_school', city: '', state: '',
    grade_levels: [] as string[],
    program_types: [] as string[],
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleProgram(p: string) {
    setForm(f => ({
      ...f,
      program_types: f.program_types.includes(p)
        ? f.program_types.filter(x => x !== p)
        : [...f.program_types, p],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.school_name.trim() || !form.contact_name.trim() || !form.contact_email.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    if (form.program_types.length === 0) {
      setError('Please select at least one program.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/k12/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: '560px', textAlign: 'center' }}>
          <p style={{ fontSize: '64px', margin: '0 0 16px' }}>🎉</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>
            Application received!
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
            Thank you for bringing your school into the ThriveAtHome community. We&apos;ll review your application and reach out within 3 business days to discuss getting started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Hero */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '48px', margin: '0 0 16px' }}>🏫</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>
            Youth K–12 Programs
          </h1>
          <p style={{ fontSize: '20px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Connecting students with seniors — building empathy, preserving life stories, and closing the digital divide, one relationship at a time.
          </p>
        </div>

        {/* Program cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', marginBottom: '48px' }}>
          {PROGRAMS.map(prog => (
            <div
              key={prog.id}
              style={{
                backgroundColor: prog.color,
                border: `1.5px solid ${prog.border}`,
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>{prog.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, color: prog.text, fontFamily: 'var(--font-body)', fontSize: '16px', margin: 0 }}>
                    {prog.title}
                  </p>
                  <p style={{ color: prog.text, opacity: 0.75, fontFamily: 'var(--font-body)', fontSize: '13px', margin: '2px 0 0' }}>
                    {prog.age}
                  </p>
                </div>
              </div>
              <p style={{ color: prog.text, fontFamily: 'var(--font-body)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
                {prog.description}
              </p>
              <ul style={{ margin: 0, paddingLeft: '16px', color: prog.text, fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: 1.8 }}>
                {prog.benefits.map(b => <li key={b}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {/* Annual Intergenerational Showcase callout */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-navy) 0%, #1e3a5f 100%)',
            borderRadius: '16px',
            padding: '32px',
            color: 'var(--color-cream)',
            marginBottom: '48px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🎭</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-cream)', margin: '0 0 8px' }}>
            Annual Intergenerational Showcase
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(250,250,245,0.8)', maxWidth: '560px', margin: '0 auto 16px', lineHeight: 1.6 }}>
            Every year, students and seniors come together for a virtual showcase — sharing life stories, tech demos, pen-pal readings, and musical performances.
          </p>
          <span style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.15)', color: 'var(--color-cream)', padding: '8px 20px', borderRadius: '20px', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            Next showcase: Spring 2027 — Registration opens Fall 2026
          </span>
        </div>

        {/* Register CTA */}
        {!showRegForm ? (
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <button
              onClick={() => setShowRegForm(true)}
              style={{
                backgroundColor: 'var(--color-navy)',
                color: 'var(--color-cream)',
                border: 'none',
                padding: '18px 40px',
                borderRadius: '10px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              Register your school →
            </button>
            <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px', marginTop: '8px' }}>
              Free for all K–12 schools. No login required for initial registration.
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', border: '1.5px solid var(--color-warm-grey)', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 24px' }}>
              Register Your School
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    School name *
                  </label>
                  <input
                    type="text" required value={form.school_name}
                    onChange={e => setForm(f => ({ ...f, school_name: e.target.value }))}
                    placeholder="Lincoln High School"
                    style={{ width: '100%', height: '48px', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '0 14px', fontSize: '15px', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    School type *
                  </label>
                  <select
                    value={form.school_type} onChange={e => setForm(f => ({ ...f, school_type: e.target.value }))}
                    style={{ width: '100%', height: '48px', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '0 14px', fontSize: '15px', fontFamily: 'var(--font-body)', backgroundColor: 'white', boxSizing: 'border-box' }}
                  >
                    {SCHOOL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Contact name *
                  </label>
                  <input
                    type="text" required value={form.contact_name}
                    onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                    placeholder="Ms. Rodriguez"
                    style={{ width: '100%', height: '48px', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '0 14px', fontSize: '15px', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Contact email *
                  </label>
                  <input
                    type="email" required value={form.contact_email}
                    onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                    placeholder="teacher@school.edu"
                    style={{ width: '100%', height: '48px', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '0 14px', fontSize: '15px', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>City</label>
                  <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="San Francisco" style={{ width: '100%', height: '48px', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '0 14px', fontSize: '15px', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>State</label>
                  <input type="text" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="CA" maxLength={2} style={{ width: '100%', height: '48px', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '0 14px', fontSize: '15px', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
                  Programs you&apos;d like to participate in *
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {PROGRAMS.map(prog => (
                    <label key={prog.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={form.program_types.includes(prog.id)}
                        onChange={() => toggleProgram(prog.id)}
                        style={{ marginTop: '2px', width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)' }}>
                          {prog.icon} {prog.title}
                        </span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', display: 'block' }}>
                          {prog.description}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <p role="alert" style={{ color: '#DC2626', fontFamily: 'var(--font-body)', fontSize: '14px', margin: 0 }}>
                  ⚠️ {error}
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit" disabled={submitting}
                  style={{ flex: 1, height: '52px', backgroundColor: 'var(--color-navy)', color: 'var(--color-cream)', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '16px', cursor: submitting ? 'wait' : 'pointer' }}
                >
                  {submitting ? 'Submitting…' : 'Submit school registration →'}
                </button>
                <button
                  type="button" onClick={() => setShowRegForm(false)}
                  style={{ height: '52px', padding: '0 20px', backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
