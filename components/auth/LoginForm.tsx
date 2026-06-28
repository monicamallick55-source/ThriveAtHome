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

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Incorrect email or password. Please try again.')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Sign-in succeeded but session could not be read. Please refresh.')
        return
      }

      const { data: fm } = await supabase
        .from('family_members')
        .select('role')
        .eq('supabase_auth_id', user.id)
        .maybeSingle()

      if (!fm) {
        // Check if this is a direct senior member login (members.supabase_auth_id — added in migration 049)
        const { data: memberRow } = await (supabase as any)
          .from('members')
          .select('id')
          .eq('supabase_auth_id', user.id)
          .maybeSingle()
        if (memberRow) {
          router.push('/member-portal')
          router.refresh()
          return
        }
      }

      const role = fm?.role ?? 'family'

      if (role === 'navigator') {
        router.push('/navigator')
      } else if (role === 'admin') {
        router.push('/admin')
      } else if (role === 'volunteer') {
        router.push('/volunteer/dashboard')
      } else if (role === 'student') {
        router.push('/student')
      } else if (role === 'university_admin') {
        router.push('/university-admin')
      } else if (role === 'employer_admin') {
        router.push('/employer-admin')
      } else if (role === 'agency_admin') {
        router.push('/agency-admin')
      } else if (role === 'aaa_admin') {
        router.push('/aaa-admin')
      } else if (role === 'org_admin') {
        router.push('/org-admin')
      } else if (role === 'senior_center_admin') {
        router.push('/senior-center-admin')
      } else if (role === 'network_admin') {
        router.push('/network-admin')
      } else {
        router.push('/dashboard')
      }

      router.refresh()
    } catch (err) {
      console.error('[LoginForm] Unexpected error:', err)
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
        className="login-left-panel"
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
            &ldquo;Welcome back.<br />
            Margaret is waiting<br />
            to hear from you.&rdquo;
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
          {/* Back to home link (mobile only — desktop has wordmark in left panel) */}
          <div style={{ marginBottom: '24px' }} className="login-back-home">
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
            className="login-mobile-wordmark"
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
            Sign in
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              color: 'var(--color-text-secondary)',
              marginBottom: '40px',
            }}
          >
            Enter your details below
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{ ...inputStyle, paddingRight: '56px', opacity: loading ? 0.6 : 1 }}
                  placeholder="Your password"
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
              {loading ? 'Signing in…' : 'Sign in'}
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
            New to ThriveAtHome?{' '}
            <Link
              href="/signup"
              style={{ color: 'var(--color-navy-light)', fontWeight: 500, textDecoration: 'none' }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .login-left-panel { display: flex !important; }
          .login-mobile-wordmark { display: none !important; }
        }
      `}</style>
    </div>
  )
}
