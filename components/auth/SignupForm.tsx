'use client'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {open ? (
        <>
          <path d="M10 4C5.5 4 2 10 2 10s3.5 6 8 6 8-6 8-6-3.5-6-8-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        </>
      ) : (
        <>
          <path d="M3 3l14 14M10 4C5.5 4 2 10 2 10s1 1.5 2.8 3M10 16c4.5 0 8-6 8-6s-1-1.5-2.8-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M7.5 7.5A2.5 2.5 0 0112.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '56px',
  backgroundColor: 'white',
  border: '1.5px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-md)',
  padding: '0 16px',
  fontSize: '18px',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '18px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  marginBottom: '8px',
  fontFamily: 'var(--font-body)',
}

function passwordStrength(pw: string): number {
  if (pw.length < 4) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const RELATIONSHIP_OPTIONS = [
  'Son', 'Daughter', 'Spouse', 'Partner', 'Sibling', 'Friend', 'Caregiver', 'Other',
]

export function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [relationship, setRelationship] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const strength = passwordStrength(password)
  const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = [
    'var(--color-warm-grey)',
    'var(--color-urgent-border)',
    'var(--color-concern-border)',
    'var(--color-teal)',
    'var(--color-mood-high)',
  ]

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      })

      const data = (await res.json()) as { error?: string; success?: boolean }
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Account created. Please sign in to continue.')
        router.push('/login')
        return
      }

      router.push('/onboarding')
    } catch (err) {
      console.error('[SignupForm] Unexpected error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--color-cream)' }}>
      {/* Left panel — navy */}
      <div
        style={{
          display: 'none',
          width: '50%',
          backgroundColor: 'var(--color-navy)',
          padding: '64px 56px',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        className="signup-left-panel"
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 500,
              color: 'var(--color-cream)',
              marginBottom: 0,
            }}
          >
            ThriveAtHome
          </h1>
        </div>

        <div>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              fontWeight: 400,
              color: 'var(--color-cream)',
              fontStyle: 'italic',
              lineHeight: 1.4,
              marginBottom: '48px',
            }}
          >
            &ldquo;Join thousands of families<br />
            finding peace of mind.&rdquo;
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['HIPAA compliant', 'No contracts', 'Cancel anytime'].map((item) => (
              <span
                key={item}
                style={{
                  color: 'rgba(250,250,245,0.6)',
                  fontSize: '15px',
                  fontFamily: 'var(--font-body)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ color: 'var(--color-teal)' }}>✓</span> {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Back to home link */}
          <div style={{ marginBottom: '24px' }}>
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ← Back to home
            </Link>
          </div>

          {/* Mobile wordmark */}
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              color: 'var(--color-navy)',
              marginBottom: '32px',
              fontWeight: 500,
            }}
            className="signup-mobile-wordmark"
          >
            ThriveAtHome
          </p>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '34px',
              fontWeight: 500,
              color: 'var(--color-navy)',
              letterSpacing: '-0.01em',
              marginBottom: '8px',
            }}
          >
            Create your account
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              color: 'var(--color-text-secondary)',
              marginBottom: '40px',
            }}
          >
            Start caring for someone you love.
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label htmlFor="fullName" style={labelStyle}>Your full name</label>
              <input
                id="fullName"
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
              <label htmlFor="relationship" style={labelStyle}>Your relationship to the senior</label>
              <select
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                disabled={loading}
                style={{
                  ...inputStyle,
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <option value="">Select relationship…</option>
                {RELATIONSHIP_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="password" style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{ ...inputStyle, paddingRight: '56px', opacity: loading ? 0.6 : 1 }}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    padding: '8px',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {/* Strength indicator */}
              {password.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: '4px',
                          borderRadius: '2px',
                          backgroundColor: strength >= i ? strengthColors[strength] : 'var(--color-warm-grey)',
                          transition: 'background-color 0.3s',
                        }}
                      />
                    ))}
                  </div>
                  <p style={{ fontSize: '13px', color: strengthColors[strength], fontFamily: 'var(--font-body)', margin: 0 }}>
                    {strengthLabels[strength]}
                  </p>
                </div>
              )}
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
                  fontSize: '18px',
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
                width: '100%',
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
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p
            style={{
              marginTop: '32px',
              textAlign: 'center',
              fontSize: '18px',
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Already have an account?{' '}
            <Link
              href="/login"
              style={{ color: 'var(--color-navy-light)', fontWeight: 500, textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .signup-left-panel { display: flex !important; }
          .signup-mobile-wordmark { display: none !important; }
        }
      `}</style>
    </div>
  )
}
