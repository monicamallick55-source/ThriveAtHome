'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { ServiceBooking } from '@/lib/data/services'

type ServiceCategory = 'transport' | 'home_service' | 'meals' | 'telehealth' | 'legal_financial' | 'tech_help' | null

const CATEGORIES = [
  {
    id: 'transport' as const,
    emoji: '🚗',
    title: 'Transport',
    description: 'Rides to appointments, errands, and social outings',
    color: '#4361ee',
  },
  {
    id: 'home_service' as const,
    emoji: '🏠',
    title: 'Home Services',
    description: 'Cleaning, maintenance, and safety assessments',
    color: '#43aa8b',
  },
  {
    id: 'meals' as const,
    emoji: '🥗',
    title: 'Meals & Nutrition',
    description: 'Meal delivery, grocery help, and cooking groups',
    color: '#f8961e',
  },
  {
    id: 'telehealth' as const,
    emoji: '🏥',
    title: 'Health Services',
    description: 'Telehealth, medication management, and mental health',
    color: '#e63946',
  },
  {
    id: 'legal_financial' as const,
    emoji: '⚖️',
    title: 'Legal & Financial',
    description: 'Vetted advisor directory and document support',
    color: '#9d4edd',
  },
  {
    id: 'tech_help' as const,
    emoji: '💻',
    title: 'Tech Help',
    description: 'Phone and in-home tech support, scam awareness',
    color: '#2b9348',
  },
]

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  requested: { label: 'Requested', color: '#f8961e' },
  confirmed: { label: 'Confirmed', color: '#4361ee' },
  in_progress: { label: 'In Progress', color: '#2b9348' },
  completed: { label: 'Completed', color: '#43aa8b' },
  cancelled: { label: 'Cancelled', color: '#adb5bd' },
}

function formatBookingDate(iso: string | null) {
  if (!iso) return null
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
      timeZone: 'UTC',
    })
  } catch {
    return null
  }
}

function TransportForm({ onSuccess }: { onSuccess: (b: ServiceBooking) => void }) {
  const [pickupAddress, setPickupAddress] = useState('')
  const [destination, setDestination] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pickupAddress.trim() || !destination.trim() || !dateTime) {
      setError('Please fill in pickup address, destination, and date/time.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'transport',
          booking_details: {
            pickup_address: pickupAddress.trim(),
            destination: destination.trim(),
            date_time: dateTime,
          },
          requested_for: dateTime,
          notes: notes.trim() || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error ?? 'Unable to submit request. Please try again.')
        return
      }
      onSuccess(json.booking)
      setPickupAddress('')
      setDestination('')
      setDateTime('')
      setNotes('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid var(--color-warm-grey)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)',
    fontSize: '16px',
    color: 'var(--color-navy)',
    backgroundColor: 'white',
    boxSizing: 'border-box',
    minHeight: '52px',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label htmlFor="pickup" style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
          Pickup address <span aria-hidden="true" style={{ color: '#e63946' }}>*</span>
        </label>
        <input
          id="pickup"
          type="text"
          value={pickupAddress}
          onChange={(e) => setPickupAddress(e.target.value)}
          placeholder="123 Main Street, City, State"
          style={inputStyle}
          required
        />
      </div>
      <div>
        <label htmlFor="destination" style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
          Destination <span aria-hidden="true" style={{ color: '#e63946' }}>*</span>
        </label>
        <input
          id="destination"
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Doctor's office, pharmacy, grocery store…"
          style={inputStyle}
          required
        />
      </div>
      <div>
        <label htmlFor="datetime" style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
          Date &amp; time <span aria-hidden="true" style={{ color: '#e63946' }}>*</span>
        </label>
        <input
          id="datetime"
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          style={inputStyle}
          required
        />
      </div>
      <div>
        <label htmlFor="transport-notes" style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
          Additional notes (optional)
        </label>
        <textarea
          id="transport-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. wheelchair accessible vehicle needed, return trip also needed"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
        />
      </div>

      {error && (
        <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e63946', backgroundColor: '#fff0f0', border: '1px solid #e63946', borderRadius: 'var(--radius-md)', padding: '12px 16px', margin: 0 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '16px 24px',
          backgroundColor: '#4361ee',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          fontFamily: 'var(--font-body)',
          fontSize: '17px',
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
          minHeight: '56px',
          width: '100%',
        }}
      >
        {submitting ? 'Requesting…' : 'Request a ride →'}
      </button>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
        A navigator will confirm availability and coordinate your ride.
      </p>
    </form>
  )
}

function GenericServiceForm({
  serviceType,
  label,
  color,
  onSuccess,
}: {
  serviceType: string
  label: string
  color: string
  onSuccess: (b: ServiceBooking) => void
}) {
  const [details, setDetails] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!details.trim()) {
      setError('Please describe what you need.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: serviceType,
          booking_details: { description: details.trim(), preferred_time: dateTime || null },
          requested_for: dateTime || null,
          notes: notes.trim() || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error ?? 'Unable to submit request. Please try again.')
        return
      }
      onSuccess(json.booking)
      setDetails('')
      setDateTime('')
      setNotes('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid var(--color-warm-grey)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)',
    fontSize: '16px',
    color: 'var(--color-navy)',
    backgroundColor: 'white',
    boxSizing: 'border-box',
    minHeight: '52px',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label htmlFor={`${serviceType}-details`} style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
          What do you need? <span aria-hidden="true" style={{ color: '#e63946' }}>*</span>
        </label>
        <textarea
          id={`${serviceType}-details`}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={`Describe your ${label.toLowerCase()} request…`}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
          required
        />
      </div>
      <div>
        <label htmlFor={`${serviceType}-time`} style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
          Preferred date &amp; time (optional)
        </label>
        <input
          id={`${serviceType}-time`}
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          style={inputStyle}
        />
      </div>

      {error && (
        <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e63946', backgroundColor: '#fff0f0', border: '1px solid #e63946', borderRadius: 'var(--radius-md)', padding: '12px 16px', margin: 0 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '16px 24px',
          backgroundColor: color,
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          fontFamily: 'var(--font-body)',
          fontSize: '17px',
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
          minHeight: '56px',
          width: '100%',
        }}
      >
        {submitting ? 'Submitting…' : `Request ${label} →`}
      </button>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
        A navigator will follow up within one business day to coordinate.
      </p>
    </form>
  )
}

interface Props {
  initialBookings: ServiceBooking[]
}

export default function ServicesClient({ initialBookings }: Props) {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>(null)
  const [bookings, setBookings] = useState<ServiceBooking[]>(initialBookings)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function handleSuccess(booking: ServiceBooking) {
    setBookings((prev) => [booking, ...prev])
    const cat = CATEGORIES.find((c) => c.id === booking.service_type)
    setSuccessMessage(`Your ${cat?.title ?? booking.service_type} request has been submitted! A navigator will be in touch soon.`)
    setActiveCategory(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const upcomingBookings = bookings.filter((b) => ['requested', 'confirmed', 'in_progress'].includes(b.status))
  const pastBookings = bookings.filter((b) => ['completed', 'cancelled'].includes(b.status))
  const activeData = activeCategory ? CATEGORIES.find((c) => c.id === activeCategory) : null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', paddingBottom: '80px' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'white', borderBottom: '1px solid var(--color-warm-grey)', boxShadow: 'var(--shadow-sm)', height: '64px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500 }}>ThriveAtHome</span>
          <div style={{ width: '120px' }} aria-hidden="true" />
        </div>
      </nav>

      {/* Navy header */}
      <div style={{ backgroundColor: 'var(--color-navy)', padding: '40px 24px 56px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 500, color: 'var(--color-cream)', letterSpacing: '-0.01em', margin: '0 0 12px' }}>
            Services
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'rgba(250,250,245,0.8)', margin: 0, lineHeight: 1.65 }}>
            Coordinated support for everyday needs — transport, home help, meals, health, and more.
          </p>
        </div>
      </div>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
        {/* Success banner */}
        {successMessage && (
          <div
            role="status"
            style={{ backgroundColor: '#d1fae5', border: '1.5px solid #43aa8b', borderRadius: 'var(--radius-xl)', padding: '16px 20px', marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}
          >
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#1a4d3a', margin: 0, fontWeight: 500 }}>
              ✓ {successMessage}
            </p>
            <button
              onClick={() => setSuccessMessage(null)}
              aria-label="Dismiss"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#1a4d3a', padding: '4px', lineHeight: 1, flexShrink: 0 }}
            >
              ×
            </button>
          </div>
        )}

        {/* Upcoming services */}
        {upcomingBookings.length > 0 && (
          <section style={{ marginTop: '40px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>
              Scheduled services
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingBookings.map((booking) => {
                const cat = CATEGORIES.find((c) => c.id === booking.service_type)
                const statusInfo = STATUS_LABELS[booking.status] ?? { label: booking.status, color: '#adb5bd' }
                const requestedDate = formatBookingDate(booking.requested_for)
                return (
                  <div
                    key={booking.id}
                    style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-xl)', padding: '20px 24px', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: '16px' }}
                  >
                    <span style={{ fontSize: '28px', flexShrink: 0 }} aria-hidden="true">{cat?.emoji ?? '📋'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
                          {cat?.title ?? booking.service_type}
                        </p>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'white', backgroundColor: statusInfo.color, borderRadius: '20px', padding: '3px 10px' }}>
                          {statusInfo.label}
                        </span>
                      </div>
                      {booking.booking_details && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {booking.service_type === 'transport'
                            ? `${(booking.booking_details as Record<string, string>).pickup_address} → ${(booking.booking_details as Record<string, string>).destination}`
                            : (booking.booking_details as Record<string, string>).description ?? ''}
                        </p>
                      )}
                      {requestedDate && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                          {requestedDate}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Category cards grid */}
        <section style={{ marginTop: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>
            Request a service
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            Choose a category to get started. A navigator will coordinate everything for you.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }} className="services-grid">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(isActive ? null : cat.id)}
                  aria-expanded={isActive}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '24px',
                    backgroundColor: isActive ? `${cat.color}12` : 'white',
                    border: isActive ? `2px solid ${cat.color}` : '1.5px solid var(--color-warm-grey)',
                    borderRadius: 'var(--radius-xl)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'all 0.2s',
                    minHeight: '120px',
                  }}
                >
                  <span style={{ fontSize: '32px', lineHeight: 1 }} aria-hidden="true">{cat.emoji}</span>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: isActive ? cat.color : 'var(--color-navy)', margin: 0 }}>
                      {cat.title}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                      {cat.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
          <style>{`
            @media (min-width: 640px) { .services-grid { grid-template-columns: repeat(3, 1fr) !important; } }
          `}</style>
        </section>

        {/* Active service form */}
        {activeCategory && activeData && (
          <section
            style={{ marginTop: '32px', backgroundColor: 'white', border: `2px solid ${activeData.color}`, borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-card)' }}
            aria-label={`${activeData.title} request form`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: '32px' }} aria-hidden="true">{activeData.emoji}</span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
                {activeData.title}
              </h3>
            </div>

            {activeCategory === 'transport' ? (
              <TransportForm onSuccess={handleSuccess} />
            ) : activeCategory === 'legal_financial' ? (
              <div>
                <div style={{ backgroundColor: '#f8f4ff', border: '1px solid #9d4edd', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#4a1d6d', margin: 0, lineHeight: 1.65 }}>
                    <strong>Our navigators can connect you</strong> with vetted elder law attorneys, financial advisors, and document support specialists. We never recommend specific firms — instead we provide a warm, personal introduction to appropriate professionals.
                  </p>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '12px' }}>
                    Available through our navigator team:
                  </p>
                  {[
                    { icon: '⚖️', label: 'Elder law attorney', desc: 'Estate planning, wills, power of attorney' },
                    { icon: '💰', label: 'Financial advisor/planner', desc: 'Retirement, benefits optimization, budgeting' },
                    { icon: '📋', label: 'Document vault support', desc: 'Organizing and safeguarding important documents' },
                    { icon: '🏠', label: 'Housing & benefits advisor', desc: 'Housing assistance, Medicaid, Medicare planning' },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--color-warm-grey)' }}>
                      <span style={{ fontSize: '20px', flexShrink: 0 }} aria-hidden="true">{item.icon}</span>
                      <div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', margin: 0 }}>{item.label}</p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <GenericServiceForm serviceType="legal_financial" label="Legal & Financial Support" color={activeData.color} onSuccess={handleSuccess} />
              </div>
            ) : (
              <GenericServiceForm serviceType={activeCategory} label={activeData.title} color={activeData.color} onSuccess={handleSuccess} />
            )}
          </section>
        )}

        {/* Past services */}
        {pastBookings.length > 0 && (
          <section style={{ marginTop: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>
              Service history
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pastBookings.map((booking) => {
                const cat = CATEGORIES.find((c) => c.id === booking.service_type)
                const statusInfo = STATUS_LABELS[booking.status] ?? { label: booking.status, color: '#adb5bd' }
                return (
                  <div
                    key={booking.id}
                    style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.85 }}
                  >
                    <span style={{ fontSize: '22px', flexShrink: 0 }} aria-hidden="true">{cat?.emoji ?? '📋'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', margin: 0 }}>{cat?.title ?? booking.service_type}</p>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, color: statusInfo.color, backgroundColor: `${statusInfo.color}18`, borderRadius: '20px', padding: '2px 8px' }}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                        {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {bookings.length === 0 && !activeCategory && (
          <div style={{ marginTop: '40px', textAlign: 'center', padding: '48px 24px', backgroundColor: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-warm-grey)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: '40px', margin: '0 0 16px' }} aria-hidden="true">🤝</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', margin: '0 0 8px', fontWeight: 500 }}>
              No services yet
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Choose a category above to request coordinated support for your loved one.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
