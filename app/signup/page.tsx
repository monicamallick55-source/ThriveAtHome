'use client'
// app/signup/page.tsx — 3-step member onboarding wizard
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronRight, Loader2, Eye, EyeOff } from 'lucide-react'

type Plan = 'basics' | 'complete'
type Billing = 'monthly' | 'annual'

const PLAN_NAMES: Record<Plan, string> = {
  basics: 'Thrive Basics',
  complete: 'Thrive Complete',
}

const PLAN_PRICES: Record<Plan, { monthly: string; annual: string; annualMonthly: string }> = {
  basics: { monthly: '$39/mo', annual: '$421/yr', annualMonthly: '$35.08/mo' },
  complete: { monthly: '$79/mo', annual: '$853/yr', annualMonthly: '$71.08/mo' },
}

const PLAN_FEATURES: Record<Plan, string[]> = {
  basics: [
    'Quinn AI concierge — 24/7 by phone',
    'Aria daily check-in calls',
    'Emergency alerts to family',
    'Family portal — 3 seats',
    'Community circles & events',
    'Benefits navigation (SHIP, SNAP, AAA)',
  ],
  complete: [
    'Everything in Basics',
    'Volunteer rides & transportation',
    'Meals coordination',
    'Friendly visits & companionship',
    'Tech help at home',
    'Proactive Care Navigator — 2 hrs/month',
    'Services marketplace',
    'Family portal — 8 seats',
  ],
}

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: i < step ? '#2d6a4f' : i === step ? '#52b788' : '#e8f5e9',
            color: i <= step ? '#fff' : '#999',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
          }}>
            {i < step ? <Check size={14} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div style={{ width: '40px', height: '2px', background: i < step ? '#2d6a4f' : '#e0e0e0', transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function SignupPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [plan, setPlan] = useState<Plan>((searchParams.get('plan') as Plan) || 'basics')
  const [billing, setBilling] = useState<Billing>((searchParams.get('billing') as Billing) || 'monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: '',
    zip: '',
    forSelf: true,
  })

  // If plan is pre-selected from URL, jump straight to step 1 (account creation)
  useEffect(() => {
    const urlPlan = searchParams.get('plan') as Plan | null
    if (urlPlan && ['basics', 'complete'].includes(urlPlan)) {
      setPlan(urlPlan)
      if (searchParams.get('billing') === 'annual') setBilling('annual')
      setStep(1)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const STEP_LABELS = ['Choose Plan', 'Your Info', 'Payment']

  async function handleCreateAccount() {
    setError('')
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      setError('Please fill in all required fields.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            date_of_birth: form.dateOfBirth,
            zip: form.zip,
            for_self: form.forSelf,
          },
        },
      })
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email already exists. Try signing in.')
        } else {
          setError(signUpError.message)
        }
        return
      }
      setStep(2)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckout() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing, email: form.email }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || 'Failed to start checkout. Please try again.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1.5px solid #d0d0d0', fontSize: '16px', boxSizing: 'border-box',
    fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '6px', display: 'block',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7faf7', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px' }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', marginBottom: '32px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#2d6a4f', letterSpacing: '-0.5px' }}>
          Thrive<span style={{ color: '#52b788' }}>@Home</span>
        </div>
      </Link>

      <div style={{ width: '100%', maxWidth: '520px' }}>
        <StepIndicator step={step} total={3} />

        {/* Step labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', padding: '0 8px' }}>
          {STEP_LABELS.map((label, i) => (
            <span key={i} style={{ fontSize: '12px', color: i <= step ? '#2d6a4f' : '#aaa', fontWeight: i === step ? 700 : 400 }}>
              {label}
            </span>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

          {/* ── STEP 0: Choose Plan ─────────────────────────────── */}
          {step === 0 && (
            <>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a', marginBottom: '8px' }}>
                Choose your plan
              </h1>
              <p style={{ color: '#666', marginBottom: '24px', fontSize: '15px' }}>
                Start with what fits — upgrade anytime.
              </p>

              {/* Billing toggle */}
              <div style={{ display: 'flex', background: '#f0faf4', borderRadius: '10px', padding: '4px', marginBottom: '20px', width: 'fit-content' }}>
                {(['monthly', 'annual'] as Billing[]).map(b => (
                  <button key={b} onClick={() => setBilling(b)} style={{
                    padding: '8px 20px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                    background: billing === b ? '#2d6a4f' : 'transparent',
                    color: billing === b ? '#fff' : '#555',
                    fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
                  }}>
                    {b === 'monthly' ? 'Monthly' : 'Annual (save 10%)'}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(['basics', 'complete'] as Plan[]).map(p => (
                  <button key={p} onClick={() => setPlan(p)} style={{
                    textAlign: 'left', padding: '20px', borderRadius: '12px', border: `2px solid ${plan === p ? '#52b788' : '#e0e0e0'}`,
                    background: plan === p ? '#f0faf4' : '#fff', cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a1a' }}>{PLAN_NAMES[p]}</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#2d6a4f', margin: '4px 0' }}>
                          {PLAN_PRICES[p][billing]}
                        </div>
                        {billing === 'annual' && (
                          <div style={{ fontSize: '12px', color: '#888' }}>({PLAN_PRICES[p].annualMonthly} billed annually)</div>
                        )}
                      </div>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                        border: `2px solid ${plan === p ? '#52b788' : '#ccc'}`,
                        background: plan === p ? '#52b788' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {plan === p && <Check size={12} color="#fff" strokeWidth={3} />}
                      </div>
                    </div>
                    <ul style={{ margin: '12px 0 0', padding: '0 0 0 18px', listStyle: 'none' }}>
                      {PLAN_FEATURES[p].slice(0, 4).map(f => (
                        <li key={f} style={{ fontSize: '13px', color: '#555', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Check size={11} color="#52b788" strokeWidth={3} style={{ flexShrink: 0 }} /> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <button onClick={() => setStep(1)} style={{
                width: '100%', marginTop: '24px', padding: '14px', borderRadius: '10px',
                background: '#2d6a4f', color: '#fff', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                Continue with {PLAN_NAMES[plan]} <ChevronRight size={18} />
              </button>

              <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#888' }}>
                Already a member?{' '}
                <Link href="/dashboard" style={{ color: '#2d6a4f', fontWeight: 600 }}>Sign in</Link>
              </p>
            </>
          )}

          {/* ── STEP 1: Account Info ────────────────────────────── */}
          {step === 1 && (
            <>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a', marginBottom: '8px' }}>
                Create your account
              </h1>
              <p style={{ color: '#666', marginBottom: '24px', fontSize: '15px' }}>
                Plan: <strong style={{ color: '#2d6a4f' }}>{PLAN_NAMES[plan]}</strong> · {PLAN_PRICES[plan][billing]}
                {' '}
                <button onClick={() => setStep(0)} style={{ background: 'none', border: 'none', color: '#52b788', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
                  (change)
                </button>
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>First name *</label>
                  <input style={inputStyle} placeholder="Margaret" autoComplete="given-name" {...field('firstName')} />
                </div>
                <div>
                  <label style={labelStyle}>Last name *</label>
                  <input style={inputStyle} placeholder="Johnson" autoComplete="family-name" {...field('lastName')} />
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={labelStyle}>Email address *</label>
                <input type="email" style={inputStyle} placeholder="margaret@example.com" autoComplete="email" {...field('email')} />
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={labelStyle}>Phone number</label>
                <input type="tel" style={inputStyle} placeholder="(555) 123-4567" autoComplete="tel" {...field('phone')} />
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={labelStyle}>Password * (8+ characters)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    style={{ ...inputStyle, paddingRight: '44px' }}
                    placeholder="Choose a password"
                    autoComplete="new-password"
                    {...field('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label style={labelStyle}>Date of birth</label>
                  <input type="date" style={inputStyle} {...field('dateOfBirth')} />
                </div>
                <div>
                  <label style={labelStyle}>ZIP code</label>
                  <input style={inputStyle} placeholder="90210" maxLength={5} {...field('zip')} />
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" checked={form.forSelf} onChange={() => setForm(f => ({ ...f, forSelf: true }))} style={{ marginTop: '3px' }} />
                  <span style={{ fontSize: '14px', color: '#333' }}>I'm signing up for myself</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" checked={!form.forSelf} onChange={() => setForm(f => ({ ...f, forSelf: false }))} style={{ marginTop: '3px' }} />
                  <span style={{ fontSize: '14px', color: '#333' }}>I'm signing up for a loved one</span>
                </label>
              </div>

              {error && (
                <div style={{ marginTop: '16px', padding: '12px 16px', background: '#fff0f0', borderRadius: '8px', border: '1px solid #ffcccc', color: '#c0392b', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <button onClick={handleCreateAccount} disabled={loading} style={{
                width: '100%', marginTop: '24px', padding: '14px', borderRadius: '10px',
                background: loading ? '#ccc' : '#2d6a4f', color: '#fff', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</> : <>Continue to Payment <ChevronRight size={18} /></>}
              </button>

              <button onClick={() => setStep(0)} style={{ width: '100%', marginTop: '12px', padding: '10px', borderRadius: '8px', border: '1.5px solid #d0d0d0', background: '#fff', color: '#555', cursor: 'pointer', fontSize: '14px' }}>
                ← Back
              </button>

              <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', marginTop: '16px' }}>
                By continuing, you agree to our{' '}
                <Link href="/terms" style={{ color: '#2d6a4f' }}>Terms</Link> and{' '}
                <Link href="/privacy" style={{ color: '#2d6a4f' }}>Privacy Policy</Link>.
              </p>
            </>
          )}

          {/* ── STEP 2: Payment ────────────────────────────────── */}
          {step === 2 && (
            <>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a', marginBottom: '8px' }}>
                Confirm & pay
              </h1>
              <p style={{ color: '#666', marginBottom: '24px', fontSize: '15px' }}>
                You'll be securely redirected to Stripe to complete payment.
              </p>

              {/* Order summary */}
              <div style={{ background: '#f7faf7', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #d4edda' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{PLAN_NAMES[plan]}</span>
                  <span style={{ fontWeight: 700, color: '#2d6a4f' }}>{PLAN_PRICES[plan][billing]}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {billing === 'annual' ? 'Billed annually' : 'Billed monthly'} · Cancel anytime
                </div>
                <div style={{ borderTop: '1px solid #d4edda', marginTop: '12px', paddingTop: '12px' }}>
                  <ul style={{ margin: 0, padding: '0 0 0 16px', listStyle: 'none' }}>
                    {PLAN_FEATURES[plan].slice(0, 5).map(f => (
                      <li key={f} style={{ fontSize: '13px', color: '#555', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={11} color="#52b788" strokeWidth={3} style={{ flexShrink: 0 }} /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Account summary */}
              <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', border: '1px solid #e0e0e0', fontSize: '14px', color: '#555' }}>
                <div>Account: <strong style={{ color: '#1a1a1a' }}>{form.firstName} {form.lastName}</strong></div>
                <div style={{ marginTop: '4px' }}>Email: <strong style={{ color: '#1a1a1a' }}>{form.email}</strong></div>
              </div>

              {error && (
                <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fff0f0', borderRadius: '8px', border: '1px solid #ffcccc', color: '#c0392b', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <button onClick={handleCheckout} disabled={loading} style={{
                width: '100%', padding: '16px', borderRadius: '10px',
                background: loading ? '#ccc' : '#2d6a4f', color: '#fff', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Connecting to Stripe…</> : <>🔒 Pay securely with Stripe</>}
              </button>

              <button onClick={() => setStep(1)} style={{ width: '100%', marginTop: '12px', padding: '10px', borderRadius: '8px', border: '1.5px solid #d0d0d0', background: '#fff', color: '#555', cursor: 'pointer', fontSize: '14px' }}>
                ← Back to account info
              </button>

              <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', marginTop: '16px' }}>
                🔒 Payment secured by Stripe. We never see your card details.
              </p>
            </>
          )}
        </div>

        {/* Medicare note */}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#aaa' }}>
          Some Medicare Advantage plans may cover ThriveAtHome. Ask Quinn to check your plan.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
