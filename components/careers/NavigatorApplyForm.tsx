'use client'
import { useState, type FormEvent } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '52px',
  backgroundColor: 'white',
  border: '1.5px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-md)',
  padding: '0 16px',
  fontSize: '17px',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '16px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  marginBottom: '8px',
  fontFamily: 'var(--font-body)',
}

export function NavigatorApplyForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [whyInterested, setWhyInterested] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!fullName.trim() || !email.trim() || !whyInterested.trim()) {
      setError('Please fill in your name, email, and why you\'re interested.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/careers/navigator/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          linkedin_url: linkedinUrl.trim() || undefined,
          why_interested: whyInterested.trim(),
        }),
      })
      const data = (await res.json()) as { error?: string; success?: boolean }
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      setSubmitted(true)
    } catch (err) {
      console.error('[NavigatorApplyForm] Unexpected error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div
        style={{
          backgroundColor: 'var(--color-teal-muted, #E6F4F6)',
          border: '1px solid var(--color-teal)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', marginBottom: '8px' }}>
          Thank you for applying!
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', margin: 0 }}>
          We&apos;ve received your application and will be in touch soon.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label htmlFor="full_name" style={labelStyle}>Full name</label>
        <input
          id="full_name"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
          style={{ ...inputStyle, opacity: loading ? 0.6 : 1 }}
          placeholder="Jane Smith"
        />
      </div>

      <div>
        <label htmlFor="email" style={labelStyle}>Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          style={{ ...inputStyle, opacity: loading ? 0.6 : 1 }}
          placeholder="jane@example.com"
        />
      </div>

      <div>
        <label htmlFor="linkedin_url" style={labelStyle}>LinkedIn profile (optional)</label>
        <input
          id="linkedin_url"
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          disabled={loading}
          style={{ ...inputStyle, opacity: loading ? 0.6 : 1 }}
          placeholder="https://linkedin.com/in/janesmith"
        />
      </div>

      <div>
        <label htmlFor="why_interested" style={labelStyle}>Why are you interested in this role?</label>
        <textarea
          id="why_interested"
          required
          value={whyInterested}
          onChange={(e) => setWhyInterested(e.target.value)}
          disabled={loading}
          rows={5}
          style={{
            ...inputStyle,
            height: 'auto',
            padding: '14px 16px',
            resize: 'vertical',
            opacity: loading ? 0.6 : 1,
          }}
          placeholder="Tell us a bit about your background and what draws you to this work."
        />
      </div>

      {error && (
        <p
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            backgroundColor: 'var(--color-urgent)',
            color: 'var(--color-urgent-text)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            fontSize: '16px',
            fontFamily: 'var(--font-body)',
            margin: 0,
            border: '1px solid var(--color-urgent-border)',
          }}
        >
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          height: '56px',
          backgroundColor: 'var(--color-navy)',
          color: 'var(--color-cream)',
          fontFamily: 'var(--font-body)',
          fontSize: '18px',
          fontWeight: 500,
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  )
}
