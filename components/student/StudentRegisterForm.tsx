'use client'

import { useState } from 'react'

interface Props {
  email: string
}

const CURRENT_YEAR = new Date().getFullYear()

export default function StudentRegisterForm({ email }: Props) {
  const [form, setForm] = useState({
    full_name: '',
    university_name: '',
    major: '',
    graduation_year: CURRENT_YEAR + 2,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim() || !form.university_name.trim()) {
      setError('Name and university are required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, email }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Registration failed. Please try again.')
        return
      }
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1a7a6a', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '32px', color: 'white' }}>✓</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--color-navy)', marginBottom: '12px', fontWeight: 500 }}>
            Registration submitted
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
            Your student volunteer account is pending review. Please reload this page once your account has been activated by your coordinator.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '24px', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 500, backgroundColor: 'var(--color-navy)', color: 'var(--color-cream)', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 28px', cursor: 'pointer', minHeight: '48px' }}
          >
            Reload page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
      <div style={{ maxWidth: '520px', width: '100%', background: 'white', borderRadius: 'var(--radius-xl)', padding: '40px', border: '1px solid rgba(30,58,95,0.1)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--color-navy)', marginBottom: '8px', fontWeight: 500 }}>
          Student Volunteer Registration
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
          Register to track your community service hours and download a verified service record for your university.
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '20px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#c62828', margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Full name', key: 'full_name', type: 'text', required: true },
            { label: 'University name', key: 'university_name', type: 'text', required: true },
            { label: 'Major / Program', key: 'major', type: 'text', required: false },
          ].map(({ label, key, type, required }) => (
            <div key={key} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                {label} {required && <span style={{ color: '#c62828' }}>*</span>}
              </label>
              <input
                type={type}
                value={form[key as keyof typeof form] as string}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required={required}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(30,58,95,0.25)', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
              Expected graduation year
            </label>
            <select
              value={form.graduation_year}
              onChange={(e) => setForm((f) => ({ ...f, graduation_year: Number(e.target.value) }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(30,58,95,0.25)', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }}
            >
              {Array.from({ length: 8 }, (_, i) => CURRENT_YEAR + i).map((y: any) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              fontFamily: 'var(--font-body)',
              fontSize: '17px',
              fontWeight: 500,
              backgroundColor: 'var(--color-navy)',
              color: 'var(--color-cream)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '14px 24px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              minHeight: '52px',
            }}
          >
            {submitting ? 'Registering...' : 'Register as student volunteer'}
          </button>
        </form>
      </div>
    </div>
  )
}
