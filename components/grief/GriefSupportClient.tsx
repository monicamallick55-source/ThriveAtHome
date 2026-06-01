'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { GriefSupportRequest } from '@/lib/data/grief'

interface Props {
  memberName: string
  existingRequests: GriefSupportRequest[]
}

type LossType = {
  id: string
  emoji: string
  title: string
  desc: string
  color: string
  accent: string
}

const LOSS_TYPES: LossType[] = [
  {
    id: 'loss_of_loved_one',
    emoji: '🕊️',
    title: 'Loss of a loved one',
    desc: 'Navigating grief after the death of a spouse, family member, or dear friend.',
    color: '#EFF6FF',
    accent: '#1E3A5F',
  },
  {
    id: 'major_health_diagnosis',
    emoji: '🏥',
    title: 'Major health diagnosis',
    desc: 'Coping with a new diagnosis — cancer, dementia, heart disease, or other conditions.',
    color: '#F0FDF4',
    accent: '#065F46',
  },
  {
    id: 'moving_to_care_setting',
    emoji: '🏠',
    title: 'Moving to a care setting',
    desc: 'Navigating the emotional transition of moving into assisted living, memory care, or a nursing facility.',
    color: '#FFF7ED',
    accent: '#92400E',
  },
  {
    id: 'loss_of_driving',
    emoji: '🚗',
    title: 'Loss of driving independence',
    desc: 'Adjusting to life without the freedom of driving — and finding new ways to stay connected.',
    color: '#F0F9FF',
    accent: '#0C4A6E',
  },
  {
    id: 'major_life_change',
    emoji: '🌱',
    title: 'Another major life change',
    desc: 'Any significant life transition — retirement, loss of a home, loss of a close relationship.',
    color: '#FDF4FF',
    accent: '#6B21A8',
  },
]

const CIRCLE_TYPES = [
  'Phone support circle (weekly call)',
  'One-on-one navigator support',
  'Peer support group (others who share similar loss)',
  'Professional counseling referral',
  'I\'m not sure — help me find the right fit',
]

const AVAILABILITY = [
  'Morning (9am – 12pm)',
  'Afternoon (12pm – 4pm)',
  'Evening (4pm – 7pm)',
  'Weekends preferred',
  'Any time works',
]

export default function GriefSupportClient({ memberName, existingRequests }: Props) {
  const [selectedLoss, setSelectedLoss] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [circleType, setCircleType] = useState('')
  const [availability, setAvailability] = useState('')
  const [notes, setNotes] = useState('')
  const [anniversaryDate, setAnniversaryDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasPendingRequest = existingRequests.some(r => r.status === 'pending')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLoss) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/grief-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lossType: selectedLoss,
          circleTypeRequested: circleType || undefined,
          availabilityPreference: availability || undefined,
          additionalNotes: notes || undefined,
          lossAnniversaryDate: anniversaryDate || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Submission failed'); return }
      setSubmitted(true)
    } catch {
      setError('Unexpected error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedLossType = LOSS_TYPES.find(l => l.id === selectedLoss)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'white', borderBottom: '1px solid var(--color-warm-grey)', boxShadow: 'var(--shadow-sm)', height: '64px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500 }}>ThriveAtHome</span>
          <div style={{ width: '100px' }} aria-hidden="true" />
        </div>
      </nav>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '14px' }}>
            Grief &amp; Transition Support
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.65 }}>
            You don&apos;t have to face life&apos;s hardest moments alone. Our navigators and peer support circles
            are here to walk beside you.
          </p>
        </div>

        {/* Existing request notice */}
        {hasPendingRequest && (
          <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '12px', padding: '18px 22px', marginBottom: '32px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#065F46', marginBottom: '4px' }}>
              ✓ Support request received
            </div>
            <div style={{ fontSize: '14px', color: '#047857' }}>
              Our navigator team has your request and will be in touch within 24 hours. You can submit additional requests below.
            </div>
          </div>
        )}

        {/* Submitted confirmation */}
        {submitted && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '16px', padding: '28px', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🕊️</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: '#065F46', marginBottom: '10px' }}>
                We&apos;re here with you.
              </h2>
              <p style={{ fontSize: '16px', color: '#047857', maxWidth: '420px', margin: '0 auto 16px', lineHeight: 1.6 }}>
                Your request has been received. A navigator will reach out within 24 hours to talk through next steps together.
              </p>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                In the meantime, your daily check-in call has been adjusted so we can stay close during this time.
              </p>
              <Link
                href="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--color-navy)',
                  color: 'var(--color-cream)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  fontWeight: 600,
                  padding: '14px 28px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  minHeight: '48px',
                  lineHeight: 1,
                }}
              >
                💬 Talk to a navigator now
              </Link>
            </div>

            {/* Professional referral info */}
            <div style={{ backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '14px', padding: '22px 24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: '#1E3A5F', marginBottom: '8px' }}>
                Would you like to speak with a professional?
              </h3>
              <p style={{ fontSize: '15px', color: '#1E40AF', lineHeight: 1.6, marginBottom: '0' }}>
                If you&apos;d like to connect with a grief counselor, therapist, or other licensed professional, our navigators
                can provide a warm, personal introduction — never just a phone number. Let your navigator know during your
                call and they will match you with vetted professionals in your area.
              </p>
            </div>
          </div>
        )}

        {/* 4 category cards */}
        {!submitted && (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--color-navy)', marginBottom: '6px' }}>
                What are you navigating?
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                Select the area where you need support. There&apos;s no wrong answer.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                {LOSS_TYPES.map(lt => {
                  const isSelected = selectedLoss === lt.id
                  return (
                    <button
                      key={lt.id}
                      type="button"
                      onClick={() => { setSelectedLoss(lt.id); setShowForm(true) }}
                      style={{
                        textAlign: 'left', border: isSelected ? `2px solid ${lt.accent}` : '1.5px solid var(--color-warm-grey)',
                        borderRadius: '14px', padding: '20px', cursor: 'pointer',
                        backgroundColor: isSelected ? lt.color : 'white',
                        transition: 'all 0.15s', boxShadow: isSelected ? `0 4px 12px ${lt.accent}22` : '0 1px 4px rgba(0,0,0,0.06)',
                      }}
                    >
                      <div style={{ fontSize: '28px', marginBottom: '10px' }}>{lt.emoji}</div>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: lt.accent, marginBottom: '6px' }}>
                        {isSelected ? '✓ ' : ''}{lt.title}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{lt.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Request form */}
            {showForm && selectedLossType && (
              <div style={{ backgroundColor: 'white', border: `2px solid ${selectedLossType.accent}`, borderRadius: '16px', padding: '32px', marginBottom: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '28px' }}>{selectedLossType.emoji}</span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', margin: 0 }}>
                      Support for: {selectedLossType.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                      Tell us a little more so we can find the best fit for {memberName}.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Circle type */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '10px' }}>
                      What kind of support sounds right? <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span>
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {CIRCLE_TYPES.map(ct => (
                        <label key={ct} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: circleType === ct ? '#EFF6FF' : '#F9FAFB', border: circleType === ct ? '1.5px solid var(--color-navy)' : '1.5px solid transparent' }}>
                          <input
                            type="radio"
                            name="circleType"
                            value={ct}
                            checked={circleType === ct}
                            onChange={() => setCircleType(ct)}
                            style={{ marginTop: '2px', accentColor: 'var(--color-navy)', flexShrink: 0 }}
                          />
                          <span style={{ fontSize: '14px', color: 'var(--color-navy)' }}>{ct}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '10px' }}>
                      Best time to reach you <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {AVAILABILITY.map(a => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setAvailability(a)}
                          style={{
                            padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            border: availability === a ? '2px solid var(--color-navy)' : '1.5px solid var(--color-warm-grey)',
                            backgroundColor: availability === a ? 'var(--color-navy)' : 'white',
                            color: availability === a ? 'white' : 'var(--color-text-secondary)',
                          }}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                      Anything else you&apos;d like us to know <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Share anything that will help our navigator provide the best support…"
                      rows={3}
                      style={{ width: '100%', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '10px 14px', fontSize: '15px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
                    />
                  </div>

                  {/* Anniversary date — shown for loss_of_loved_one */}
                  {selectedLoss === 'loss_of_loved_one' && (
                    <div style={{ marginBottom: '24px', backgroundColor: '#F8F7FF', borderRadius: '10px', padding: '16px 18px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                        Anniversary of the loss <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional — helps us check in around difficult dates)</span>
                      </label>
                      <input
                        type="date"
                        value={anniversaryDate}
                        onChange={e => setAnniversaryDate(e.target.value)}
                        style={{ border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '10px 14px', fontSize: '15px', fontFamily: 'var(--font-body)' }}
                      />
                      {anniversaryDate && (
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                          We&apos;ll increase your check-in frequency in the week before this date each year.
                        </p>
                      )}
                    </div>
                  )}

                  {error && (
                    <div role="alert" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#DC2626', fontSize: '14px' }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%', padding: '15px', borderRadius: '10px', border: 'none',
                      backgroundColor: submitting ? '#9CA3AF' : 'var(--color-navy)',
                      color: 'white', fontSize: '16px', fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? 'Connecting you with support…' : 'Connect me with support →'}
                  </button>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '10px' }}>
                    A navigator will reach out within 24 hours. This is always a warm, personal conversation — never just a phone number.
                  </p>
                </form>
              </div>
            )}
          </>
        )}

        {/* Resources section */}
        <section style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', marginBottom: '16px' }}>
            Trusted resources
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { name: 'GriefShare', desc: 'Faith-based grief support groups across the United States.', href: 'https://www.griefshare.org' },
              { name: 'National Alliance for Grieving Children', desc: 'Resources for adults supporting children through grief.', href: 'https://childrengrieve.org' },
              { name: 'SAMHSA Helpline', desc: 'Free, confidential, 24/7 mental health and substance use treatment referrals.', href: 'https://www.samhsa.gov/find-help/national-helpline' },
              { name: 'Hospice Foundation of America', desc: 'Resources for families navigating end-of-life care and bereavement.', href: 'https://hospicefoundation.org' },
              { name: 'American Foundation for Suicide Prevention', desc: 'Resources for those who have lost someone to suicide.', href: 'https://afsp.org' },
              { name: 'Veterans Crisis Line', desc: 'Confidential crisis support for veterans and their families, 24/7.', href: 'https://www.veteranscrisisline.net' },
            ].map(r => (
              <a
                key={r.name}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--color-warm-grey)', textDecoration: 'none', cursor: 'pointer' }}
              >
                <span style={{ color: 'var(--color-teal)', fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>○</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-navy)', marginBottom: '2px', textDecoration: 'underline', textUnderlineOffset: '2px' }}>{r.name} ↗</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{r.desc}</div>
                </div>
              </a>
            ))}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '16px', fontStyle: 'italic' }}>
            Our navigators can help you connect with any of these resources with a warm, personal introduction.
          </p>
        </section>

        {/* Past requests */}
        {existingRequests.length > 0 && !submitted && (
          <section style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', marginBottom: '14px' }}>
              Your support history
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {existingRequests.map(r => {
                const lossLabel = LOSS_TYPES.find(l => l.id === r.loss_type)?.title ?? r.loss_type
                const date = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
                const statusColor = r.status === 'matched' ? '#065F46' : r.status === 'pending' ? '#92400E' : '#4B5563'
                const statusBg = r.status === 'matched' ? '#D1FAE5' : r.status === 'pending' ? '#FEF3C7' : '#F3F4F6'
                return (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#F9FAFB', borderRadius: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-navy)' }}>{lossLabel}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Submitted {date}</div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, backgroundColor: statusBg, color: statusColor }}>
                      {r.status === 'matched' ? '✓ Matched' : r.status === 'pending' ? 'Pending' : r.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
