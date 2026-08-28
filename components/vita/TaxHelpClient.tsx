'use client'
// Free tax help (VITA / TCE) — eligibility triage, site list, and a request form
// that routes to a navigator for a warm hand-off. Phase 99 (M24).
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  INCOME_BANDS,
  FILING_SITUATIONS,
  WHAT_TO_BRING,
  checkEligibility,
  IRS_VITA_LOCATOR_URL,
  AARP_TAX_AIDE_LOCATOR_URL,
  GET_YOUR_REFUND_URL,
  type EligibilityResult,
} from '@/lib/vita/eligibility'
import type { VitaSiteRow, VitaAppointmentRow } from '@/types/database'

interface Props {
  age: number | null
  initialSites: VitaSiteRow[]
  initialAppointments: VitaAppointmentRow[]
}

const card: React.CSSProperties = {
  backgroundColor: 'white',
  border: '1px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
  boxShadow: 'var(--shadow-card)',
}

const label: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  fontWeight: 600,
  color: 'var(--color-navy)',
  marginBottom: '6px',
}

const field: React.CSSProperties = {
  width: '100%',
  minHeight: '52px',
  border: '1.5px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-md)',
  padding: '12px 14px',
  fontSize: '16px',
  fontFamily: 'var(--font-body)',
  backgroundColor: 'white',
  boxSizing: 'border-box',
}

function statusLabel(s: string): string {
  if (s === 'requested') return 'Request received — a navigator will be in touch'
  if (s === 'scheduled') return 'Appointment scheduled'
  if (s === 'completed') return 'Completed'
  if (s === 'cancelled') return 'Cancelled'
  return s
}

export default function TaxHelpClient({ age, initialSites, initialAppointments }: Props) {
  const currentYear = new Date().getFullYear()
  const defaultTaxYear = currentYear - 1

  const [incomeBand, setIncomeBand] = useState('')
  const [situation, setSituation] = useState('')
  const [taxYear, setTaxYear] = useState(String(defaultTaxYear))
  const [siteId, setSiteId] = useState('')
  const [needsTransport, setNeedsTransport] = useState(false)
  const [languageSupport, setLanguageSupport] = useState('')
  const [preferredDates, setPreferredDates] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [appointments, setAppointments] = useState<VitaAppointmentRow[]>(initialAppointments)

  const eligibility: EligibilityResult | null = useMemo(() => {
    if (!incomeBand || !situation) return null
    return checkEligibility({ age, incomeBand, situation })
  }, [age, incomeBand, situation])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/vita/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vita_site_id: siteId || null,
          tax_year: Number(taxYear),
          filing_situation: situation || null,
          estimated_income_band: incomeBand || null,
          needs_transport: needsTransport,
          needs_language_support: languageSupport.trim() || null,
          preferred_dates: preferredDates.trim() || null,
        }),
      })
      let json: { appointment?: VitaAppointmentRow; error?: string } = {}
      try {
        json = await res.json()
      } catch {
        json = {}
      }
      if (!res.ok) {
        setMsg({ kind: 'err', text: json.error ?? 'Something went wrong. Please try again.' })
      } else {
        if (json.appointment) setAppointments((prev) => [json.appointment as VitaAppointmentRow, ...prev])
        setMsg({
          kind: 'ok',
          text: 'Your request is in. A navigator will confirm your eligibility, book an appointment, and send the "what to bring" checklist.',
        })
        setNeedsTransport(false)
        setLanguageSupport('')
        setPreferredDates('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Existing requests */}
      {appointments.length > 0 && (
        <section style={card}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 12px' }}>
            Your tax-help requests
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {appointments.map((a) => (
              <li
                key={a.id}
                style={{
                  border: '1px solid var(--color-warm-grey)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                }}
              >
                <strong>Tax year {a.tax_year}</strong> — {statusLabel(a.status)}
                {a.scheduled_for && (
                  <span> · {new Date(a.scheduled_for).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Eligibility quick check */}
      <section style={card}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 4px' }}>
          Quick eligibility check
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 16px' }}>
          Two questions. This is a rough guide — a volunteer confirms the details.
        </p>
        <div style={{ display: 'grid', gap: '14px' }}>
          <div>
            <label htmlFor="income" style={label}>Household income last year</label>
            <select id="income" style={field} value={incomeBand} onChange={(e) => setIncomeBand(e.target.value)}>
              <option value="">Choose one…</option>
              {INCOME_BANDS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="situation" style={label}>Which best describes the return?</label>
            <select id="situation" style={field} value={situation} onChange={(e) => setSituation(e.target.value)}>
              <option value="">Choose one…</option>
              {FILING_SITUATIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {eligibility && (
          <div
            style={{
              marginTop: '16px',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              backgroundColor: eligibility.eligible ? 'var(--color-teal-muted)' : 'var(--color-cream)',
              border: `1px solid ${eligibility.eligible ? 'var(--color-teal)' : 'var(--color-warm-grey)'}`,
            }}
          >
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)', margin: '0 0 4px' }}>
              {eligibility.eligible ? '✓ ' : ''}{eligibility.headline}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
              {eligibility.detail}
            </p>
          </div>
        )}
      </section>

      {/* Nearby / virtual sites */}
      <section style={card}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 12px' }}>
          Free tax-prep sites
        </h2>
        {initialSites.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
            We don&apos;t have sites listed for your area yet. Use the official locators below, or send a request and a
            navigator will find one for you.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {initialSites.map((s) => (
              <li key={s.id} style={{ border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)', margin: '0 0 2px' }}>
                  {s.site_name}{' '}
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-teal)' }}>
                    {s.program_type === 'tce' ? 'AARP Tax-Aide (TCE)' : 'VITA'}
                  </span>
                </p>
                {s.host_org && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>{s.host_org}</p>
                )}
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {[s.address, s.city, s.state, s.zip].filter(Boolean).join(', ') || 'Virtual — file from home'}
                  {s.phone && <> · {s.phone}</>}
                </p>
                {s.hours_note && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{s.hours_note}</p>
                )}
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', margin: '6px 0 0' }}>
                  {[
                    s.appointment_required ? 'Appointment required' : 'Walk-ins welcome',
                    s.drop_off_available ? 'Drop-off available' : null,
                    s.virtual_available ? 'Virtual option' : null,
                    s.languages.length ? `Languages: ${s.languages.join(', ')}` : null,
                  ].filter(Boolean).join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '14px 0 0' }}>
          Official locators:{' '}
          <a href={IRS_VITA_LOCATOR_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-teal)' }}>IRS VITA finder ↗</a>{' · '}
          <a href={AARP_TAX_AIDE_LOCATOR_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-teal)' }}>AARP Tax-Aide ↗</a>{' · '}
          <a href={GET_YOUR_REFUND_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-teal)' }}>GetYourRefund.org ↗</a>
        </p>
      </section>

      {/* Request form */}
      <section style={card}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 12px' }}>
          Ask a navigator to arrange it
        </h2>
        <form onSubmit={submit} style={{ display: 'grid', gap: '14px' }}>
          <div>
            <label htmlFor="taxYear" style={label}>Tax year</label>
            <select id="taxYear" style={field} value={taxYear} onChange={(e) => setTaxYear(e.target.value)}>
              {[0, 1, 2, 3].map((n) => {
                const y = currentYear - 1 - n
                return <option key={y} value={y}>{y}</option>
              })}
            </select>
          </div>
          {initialSites.length > 0 && (
            <div>
              <label htmlFor="site" style={label}>Preferred site (optional)</label>
              <select id="site" style={field} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                <option value="">No preference — navigator chooses</option>
                {initialSites.map((s) => (
                  <option key={s.id} value={s.id}>{s.site_name}</option>
                ))}
              </select>
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-navy)' }}>
            <input type="checkbox" checked={needsTransport} onChange={(e) => setNeedsTransport(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: 'var(--color-teal)' }} />
            I would need a ride to the appointment
          </label>
          <div>
            <label htmlFor="lang" style={label}>Language support needed (optional)</label>
            <input id="lang" style={field} value={languageSupport} onChange={(e) => setLanguageSupport(e.target.value)} placeholder="e.g. Spanish, Mandarin" maxLength={120} />
          </div>
          <div>
            <label htmlFor="dates" style={label}>Days or times that work best (optional)</label>
            <input id="dates" style={field} value={preferredDates} onChange={(e) => setPreferredDates(e.target.value)} placeholder="e.g. weekday mornings" maxLength={300} />
          </div>

          {msg && (
            <p
              role={msg.kind === 'err' ? 'alert' : 'status'}
              style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: msg.kind === 'err' ? 'var(--color-concern)' : 'var(--color-teal-muted)',
                color: msg.kind === 'err' ? 'var(--color-concern-text)' : 'var(--color-navy)',
                border: `1px solid ${msg.kind === 'err' ? 'var(--color-concern-border)' : 'var(--color-teal)'}`,
              }}
            >
              {msg.text}
            </p>
          )}

          <div>
            <Button type="submit" loading={submitting}>Send my request</Button>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
            A navigator handles the booking personally — we never just hand you a phone number.
          </p>
        </form>
      </section>

      {/* What to bring */}
      <section style={card}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 12px' }}>
          What to bring
        </h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {WHAT_TO_BRING.map((g) => (
            <div key={g.group}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)', margin: '0 0 4px' }}>{g.group}</p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {g.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
