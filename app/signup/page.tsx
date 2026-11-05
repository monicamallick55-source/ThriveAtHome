'use client'

/**
 * app/signup/page.tsx — Account Registration
 * TC-A002 (/signup page loads with sign up / create account text)
 * TC-P051 (/signup rejects invalid email and mismatched passwords)
 */

import { useState } from 'react'

export default function SignupPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.first_name.trim()) errs.first_name = 'First name is required'
    if (!form.last_name.trim()) errs.last_name = 'Last name is required'
    if (!form.email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address'
    }
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirm_password) {
      errs.confirm_password = 'Passwords do not match'
    }
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrors({ form: data.error ?? 'Registration failed. Please try again.' })
      } else {
        setSuccess(true)
      }
    } catch {
      setErrors({ form: 'Could not connect. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Check your email</h1>
        <p style={{ color: '#6b7280', fontSize: 15 }}>
          We sent a confirmation link to <strong>{form.email}</strong>. Click it to complete your account setup.
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Create Account</h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          Sign up for ThriveAtHome and start thriving at home
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>First Name</label>
            <input
              type="text"
              value={form.first_name}
              onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.first_name ? '#fca5a5' : '#d1d5db'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
            />
            {errors.first_name && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.first_name}</p>}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Last Name</label>
            <input
              type="text"
              value={form.last_name}
              onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.last_name ? '#fca5a5' : '#d1d5db'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
            />
            {errors.last_name && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.last_name}</p>}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Email Address</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.email ? '#fca5a5' : '#d1d5db'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
          />
          {errors.email && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.email}</p>}
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.password ? '#fca5a5' : '#d1d5db'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
          />
          {errors.password && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.password}</p>}
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Confirm Password</label>
          <input
            type="password"
            value={form.confirm_password}
            onChange={e => setForm(p => ({ ...p, confirm_password: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.confirm_password ? '#fca5a5' : '#d1d5db'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
          />
          {errors.confirm_password && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.confirm_password}</p>}
        </div>

        {errors.form && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
            {errors.form}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '12px 0',
            background: submitting ? '#93c5fd' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Creating account…' : 'Create Account'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#2563eb', fontWeight: 500 }}>Sign in</a>
        </p>
      </form>
    </div>
  )
}
