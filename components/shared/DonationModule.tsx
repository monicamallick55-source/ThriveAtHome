'use client'

// Unified donation module. One implementation used by the public /donate page and
// available for the org-admin and navigator surfaces so giving is recorded the same
// way everywhere. Records the gift via POST /api/donations and shows the matching
// impact statement. When Stripe is configured server-side, "Give by card" hands off
// to Stripe Checkout in donation mode; otherwise it records a pledge and the team
// follows up. Past gifts for the entered email are listed with their impact.

import { useState, useEffect } from 'react'

const PRESET_AMOUNTS = [25, 75, 150, 300]

type PastDonation = {
  id: string
  amount_cents: number
  donation_date: string
  is_recurring: boolean
  campaign: string | null
  impact: string
}

interface Props {
  /** Optional context label stored on the donation (e.g. an org or navigator name). */
  campaignDefault?: string
  /** Pre-fill the donor's details when we already know who they are. */
  donorNameDefault?: string
  donorEmailDefault?: string
  /** Compact styling for embedding inside an admin/navigator panel. */
  compact?: boolean
  /** Optional "back" link shown on the confirmation screen (e.g. "/dashboard"). */
  backHref?: string
  backLabel?: string
}

export default function DonationModule({
  campaignDefault = '',
  donorNameDefault = '',
  donorEmailDefault = '',
  compact = false,
  backHref,
  backLabel = '← Back to Dashboard',
}: Props) {
  const [amount, setAmount] = useState<number>(75)
  const [customAmount, setCustomAmount] = useState('')
  const [name, setName] = useState(donorNameDefault)
  const [email, setEmail] = useState(donorEmailDefault)
  const [recurring, setRecurring] = useState(false)
  const [inHonorOf, setInHonorOf] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ impact: string; amount: number } | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<PastDonation[] | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [seniorsHelpedThisMonth, setSeniorsHelpedThisMonth] = useState<number | null>(null)

  const effectiveAmount = customAmount ? Math.max(0, Math.round(Number(customAmount))) : amount

  useEffect(() => {
    fetch('/api/donations')
      .then(res => res.json())
      .then(json => setSeniorsHelpedThisMonth(typeof json.seniorsHelpedThisMonth === 'number' ? json.seniorsHelpedThisMonth : 0))
      .catch(() => setSeniorsHelpedThisMonth(0))
  }, [])

  async function loadHistory(forEmail: string) {
    if (!forEmail.trim()) return
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/donations?email=${encodeURIComponent(forEmail.trim())}`)
      const json = await res.json().catch(() => ({ donations: [] }))
      setHistory(json.donations ?? [])
      if (typeof json.seniorsHelpedThisMonth === 'number') setSeniorsHelpedThisMonth(json.seniorsHelpedThisMonth)
    } catch {
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  async function submit(method: 'card' | 'pledge') {
    setError('')
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (effectiveAmount < 1) { setError('Please choose an amount of at least $1.'); return }
    setSubmitting(true)

    const campaignParts = [campaignDefault, inHonorOf ? `In honor of ${inHonorOf.trim()}` : ''].filter(Boolean)
    const payload = {
      donor_name: name.trim(),
      donor_email: email.trim() || null,
      amount_cents: effectiveAmount * 100,
      payment_method: method === 'card' ? 'card' : 'pledge',
      is_recurring: recurring,
      campaign: campaignParts.join(' · ') || null,
    }

    try {
      if (method === 'card') {
        // Try a Stripe Checkout handoff first. If the route says Stripe isn't
        // configured, fall through to recording a pledge.
        const res = await fetch('/api/donations/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json.checkoutUrl) {
          window.location.href = json.checkoutUrl
          return
        }
        // else: fall through to pledge recording below
      }

      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({ error: 'Something went wrong' }))
      if (!res.ok) { setError(json.error ?? 'Could not record your gift.'); return }
      setResult({ impact: json.impact ?? '', amount: effectiveAmount })
      if (email.trim()) loadHistory(email)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const card: React.CSSProperties = {
    backgroundColor: 'white', borderRadius: compact ? '12px' : '20px',
    padding: compact ? '20px' : '40px', border: '1px solid #E8E4DC',
  }
  const label: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px',
    color: 'var(--color-text-secondary)', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  }
  const input: React.CSSProperties = {
    width: '100%', height: '48px', padding: '0 14px', border: '1.5px solid #DDD8CE',
    borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '16px',
    color: 'var(--color-navy)', boxSizing: 'border-box', backgroundColor: 'white',
  }

  const impactBanner = seniorsHelpedThisMonth !== null && seniorsHelpedThisMonth > 0 && (
    <div style={{ padding: '14px 20px', backgroundColor: '#F0F9F7', border: '1px solid #2A9D8F30', borderRadius: '10px', marginBottom: '20px', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-navy)', fontWeight: 500 }}>
      🎉 Donations this month have helped {seniorsHelpedThisMonth} senior{seniorsHelpedThisMonth === 1 ? '' : 's'} stay connected at home.
    </div>
  )

  if (result) {
    return (
      <div style={card}>
        {impactBanner}
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>💚</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>
          Thank you{name ? `, ${name.split(' ')[0]}` : ''}!
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
          Your ${result.amount}{recurring ? '/month' : ''} gift {result.impact ? `— ${result.impact.charAt(0).toLowerCase()}${result.impact.slice(1)}` : 'makes a real difference.'}
          {' '}A receipt is on its way to your email.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setResult(null); setCustomAmount(''); }}
            style={{ padding: '10px 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
          >
            Make another gift
          </button>
          {backHref && (
            <a
              href={backHref}
              style={{ padding: '10px 20px', backgroundColor: 'white', color: 'var(--color-navy)', border: '1.5px solid #DDD8CE', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              {backLabel}
            </a>
          )}
        </div>
        {history && history.length > 0 && <PastGifts history={history} />}
      </div>
    )
  }

  return (
    <div style={card}>
      {impactBanner}
      {!compact && (
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '24px' }}>Make a Donation</h2>
      )}

      <div style={{ marginBottom: '20px' }}>
        <span style={label}>Amount</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          {PRESET_AMOUNTS.map((a: any) => (
            <button
              key={a}
              type="button"
              onClick={() => { setAmount(a); setCustomAmount('') }}
              style={{
                padding: '10px 18px', borderRadius: '10px', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600,
                border: `2px solid ${!customAmount && amount === a ? 'var(--color-teal)' : '#DDD8CE'}`,
                backgroundColor: !customAmount && amount === a ? '#F0F9F7' : 'white',
                color: !customAmount && amount === a ? 'var(--color-teal)' : 'var(--color-navy)',
              }}
            >
              ${a}
            </button>
          ))}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '12px', fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>$</span>
            <input
              type="number"
              min={1}
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              placeholder="Other"
              style={{ ...input, width: '120px', paddingLeft: '24px' }}
            />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
          Make this a monthly gift
        </label>
      </div>

      <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
        <div>
          <label style={label}>Your name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={input} placeholder="Jane Donor" />
        </div>
        <div>
          <label style={label}>Email (for your receipt &amp; giving history)</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => loadHistory(email)}
            style={input}
            placeholder="jane@example.com"
          />
        </div>
        <div>
          <label style={label}>In honor / memory of (optional)</label>
          <input value={inHonorOf} onChange={e => setInHonorOf(e.target.value)} style={input} placeholder="e.g. my mother, Margaret" />
        </div>
      </div>

      {error && <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D62828', marginBottom: '12px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => submit('card')}
          disabled={submitting}
          style={{ padding: '12px 24px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? 'Processing…' : `Give $${effectiveAmount || 0}${recurring ? '/mo' : ''} by card`}
        </button>
        <button
          type="button"
          onClick={() => submit('pledge')}
          disabled={submitting}
          style={{ padding: '12px 24px', backgroundColor: 'white', color: 'var(--color-navy)', border: '1.5px solid #DDD8CE', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer' }}
        >
          Pledge &amp; pay later
        </button>
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '16px', lineHeight: 1.6 }}>
        Card payments are processed securely by Stripe. ThriveAtHome is a mission-driven company;
        tax-deductibility varies — contact us for your situation.
      </p>

      {loadingHistory && <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '16px' }}>Loading your giving history…</p>}
      {history && history.length > 0 && <PastGifts history={history} />}
    </div>
  )
}

function PastGifts({ history }: { history: PastDonation[] }) {
  const total = history.reduce((s, d) => s + (d.amount_cents ?? 0), 0)
  const [receiptState, setReceiptState] = useState<Record<string, 'sending' | 'sent' | 'error'>>({})

  async function requestReceipt(id: string) {
    setReceiptState(s => ({ ...s, [id]: 'sending' }))
    try {
      const res = await fetch(`/api/donations/${id}/receipt`, { method: 'POST' })
      setReceiptState(s => ({ ...s, [id]: res.ok ? 'sent' : 'error' }))
    } catch {
      setReceiptState(s => ({ ...s, [id]: 'error' }))
    }
  }

  return (
    <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E8E4DC' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '4px' }}>Your giving history</h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
        ${(total / 100).toFixed(0)} given across {history.length} {history.length === 1 ? 'gift' : 'gifts'} — thank you.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {history.map((d: any) => (
          <div key={d.id} style={{ backgroundColor: '#F9F6F0', borderRadius: '10px', padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)' }}>
                ${(d.amount_cents / 100).toFixed(0)}{d.is_recurring ? '/mo' : ''}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {new Date(d.donation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>{d.impact}</p>
            <div style={{ marginTop: '8px' }}>
              {receiptState[d.id] === 'sent' ? (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#15803D', fontWeight: 600 }}>✓ Receipt emailed</span>
              ) : (
                <button
                  type="button"
                  onClick={() => requestReceipt(d.id)}
                  disabled={receiptState[d.id] === 'sending'}
                  style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid #DDD8CE', borderRadius: '6px', backgroundColor: 'white', cursor: receiptState[d.id] === 'sending' ? 'wait' : 'pointer', fontFamily: 'var(--font-body)', color: 'var(--color-navy)' }}
                >
                  {receiptState[d.id] === 'sending' ? 'Sending…' : receiptState[d.id] === 'error' ? 'Failed — retry' : 'Request tax receipt'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
