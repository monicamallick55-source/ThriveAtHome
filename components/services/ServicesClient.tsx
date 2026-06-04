'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { ServiceBooking } from '@/lib/data/services'
import { SERVICE_CATEGORIES, STATUS_INFO, DISPATCH_TYPE_LABELS, getCategoryById, getSubtypeLabel } from '@/lib/services/serviceTypes'

// ── Shared input style ──────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
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

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
      {children}{required && <span aria-hidden="true" style={{ color: '#e63946' }}> *</span>}
    </label>
  )
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#e63946', backgroundColor: '#fff0f0', border: '1px solid #e63946', borderRadius: 'var(--radius-md)', padding: '12px 16px', margin: 0 }}>
      {msg}
    </p>
  )
}

function SubmitBtn({ color, label, submitting }: { color: string; label: string; submitting: boolean }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      style={{ padding: '16px 24px', backgroundColor: color, color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-body)', fontSize: '17px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, minHeight: '56px', width: '100%' }}
    >
      {submitting ? 'Submitting…' : label}
    </button>
  )
}

// ── Booking detail helpers ─────────────────────────────────────────────────

function buildMapLink(origin: string, destination: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
}

function formatDateTime(val: string | undefined): string {
  if (!val) return ''
  try {
    return new Date(val).toLocaleString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZone: 'UTC',
    })
  } catch { return val }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 2px' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.4 }}>
        {value}
      </p>
    </div>
  )
}

function BookingDetailPanel({ booking }: { booking: ServiceBooking }) {
  const d = (booking.booking_details ?? {}) as Record<string, string>
  const cat = getCategoryById(booking.service_type)
  const statusEntry = STATUS_INFO[booking.status]

  const rows: { label: string; value: React.ReactNode }[] = []

  // Sub-type — show for all categories
  const subtypeKey = d.subtype ?? d.health_subtype ?? d.legal_subtype ?? ''
  if (subtypeKey) {
    const subtypeLabel = getSubtypeLabel(booking.service_type, subtypeKey)
    rows.push({ label: 'Type of service', value: subtypeLabel })
  }

  if (booking.service_type === 'transport') {
    if (d.pickup_address) rows.push({ label: 'Pickup address', value: d.pickup_address })
    if (d.destination) rows.push({ label: 'Destination', value: d.destination })
    if (d.pickup_address && d.destination) {
      rows.push({
        label: 'Directions',
        value: (
          <a href={buildMapLink(d.pickup_address, d.destination)} target="_blank" rel="noopener noreferrer" style={{ color: '#4361ee', fontWeight: 600 }}>
            Open in Google Maps →
          </a>
        ),
      })
    }
    const time = d.scheduled_time ?? d.date_time ?? d.preferred_time
    if (time) rows.push({ label: 'Scheduled pickup', value: formatDateTime(time) })
    if (d.assigned_volunteer) rows.push({ label: 'Your driver / volunteer', value: d.assigned_volunteer })
    if (d.wheelchair === 'yes') rows.push({ label: 'Accessibility', value: 'Wheelchair-accessible vehicle requested' })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else if (booking.service_type === 'home_service') {
    const time = d.scheduled_time ?? d.preferred_time
    if (time) rows.push({ label: 'Scheduled date & time', value: formatDateTime(time) })
    if (d.assigned_provider) rows.push({ label: 'Provider', value: d.assigned_provider })
    if (d.assigned_volunteer) rows.push({ label: 'Volunteer helper', value: d.assigned_volunteer })
    if (d.description) rows.push({ label: 'Details requested', value: d.description })
    if (d.access_notes) rows.push({ label: 'Access notes', value: d.access_notes })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else if (booking.service_type === 'meals') {
    const time = d.scheduled_time ?? d.preferred_time
    if (d.delivery_address) rows.push({ label: 'Delivery address', value: d.delivery_address })
    if (d.dietary_needs) rows.push({ label: 'Dietary requirements', value: d.dietary_needs })
    if (time) rows.push({ label: 'Delivery window', value: formatDateTime(time) })
    if (d.assigned_volunteer) rows.push({ label: 'Volunteer', value: d.assigned_volunteer })
    if (d.assigned_provider) rows.push({ label: 'Provider', value: d.assigned_provider })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else if (booking.service_type === 'telehealth') {
    const time = d.scheduled_time ?? d.preferred_time
    if (time) rows.push({ label: 'Appointment time', value: formatDateTime(time) })
    if (d.assigned_provider) rows.push({ label: 'Provider', value: d.assigned_provider })
    if (d.arrangement) rows.push({ label: 'How to join', value: d.arrangement })
    if (d.description) rows.push({ label: 'Details shared', value: d.description })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else if (booking.service_type === 'tech_help') {
    if (d.description) rows.push({ label: 'What you need help with', value: d.description })
    if (d.location_preference) rows.push({ label: 'In-home or remote', value: d.location_preference === 'in_home' ? 'In-home visit' : 'Remote / by phone' })
    const time = d.scheduled_time ?? d.preferred_time
    if (time) rows.push({ label: 'Scheduled time', value: formatDateTime(time) })
    if (d.assigned_volunteer) rows.push({ label: 'Volunteer tech helper', value: d.assigned_volunteer })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else if (booking.service_type === 'legal_financial') {
    const time = d.scheduled_time ?? d.preferred_time
    if (time) rows.push({ label: 'Appointment time', value: formatDateTime(time) })
    if (d.assigned_provider) rows.push({ label: 'Provider name', value: d.assigned_provider })
    if (d.provider_phone) rows.push({ label: 'Provider contact', value: d.provider_phone })
    if (d.description) rows.push({ label: 'Details shared', value: d.description })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else if (booking.service_type === 'companionship') {
    const time = d.scheduled_time ?? d.preferred_time
    if (time) rows.push({ label: 'Scheduled visit', value: formatDateTime(time) })
    if (d.assigned_volunteer) rows.push({ label: 'Your volunteer', value: d.assigned_volunteer })
    if (d.description) rows.push({ label: 'Notes', value: d.description })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else {
    // Fallback for unknown service types
    const time = d.scheduled_time ?? d.preferred_time ?? d.date_time
    if (time) rows.push({ label: 'Scheduled time', value: formatDateTime(time) })
    if (d.description) rows.push({ label: 'Details', value: d.description })
    if (d.assigned_volunteer) rows.push({ label: 'Volunteer', value: d.assigned_volunteer })
    if (d.assigned_provider) rows.push({ label: 'Provider', value: d.assigned_provider })
  }

  return (
    <div style={{ borderTop: '1px solid var(--color-warm-grey)', padding: '16px 24px', backgroundColor: '#fafaf8' }}>
      {/* Status context message */}
      {booking.status === 'requested' && (
        <div style={{ marginBottom: '14px', backgroundColor: '#fff7ed', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#c2410c', margin: 0 }}>
            We are arranging your {cat?.title?.toLowerCase() ?? 'service'}. Your navigator will confirm the details shortly.
          </p>
        </div>
      )}
      {booking.status === 'confirmed' && !d.assigned_volunteer && !d.assigned_provider && (
        <div style={{ marginBottom: '14px', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#1e40af', margin: 0 }}>
            {statusEntry?.description ?? 'Confirmed — your navigator will reach out with full details.'}
          </p>
        </div>
      )}
      {d.assigned_volunteer && (
        <div style={{ marginBottom: '14px', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#065f46', margin: 0, fontWeight: 500 }}>
            👤 {d.assigned_volunteer} has been assigned to help you.
          </p>
        </div>
      )}

      {/* Detail grid */}
      {rows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: booking.notes ? '14px' : 0 }}>
          {rows.map((row, i) => (
            <DetailRow key={i} label={row.label} value={row.value} />
          ))}
        </div>
      )}

      {/* Navigator notes */}
      {booking.notes && (
        <div style={{ marginTop: rows.length > 0 ? '14px' : 0, borderTop: rows.length > 0 ? '1px solid var(--color-warm-grey)' : 'none', paddingTop: rows.length > 0 ? '14px' : 0 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
            Navigator notes
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.5 }}>
            {booking.notes}
          </p>
        </div>
      )}

      {/* Empty detail state for requested bookings */}
      {rows.length === 0 && !booking.notes && booking.status === 'requested' && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
          No additional details yet — your navigator will add information once this is confirmed.
        </p>
      )}
    </div>
  )
}

// ── BookingCard ────────────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: ServiceBooking }) {
  const [expanded, setExpanded] = useState(false)
  const cat = getCategoryById(booking.service_type)
  const statusEntry = STATUS_INFO[booking.status] ?? { label: booking.status, color: '#adb5bd', description: '' }
  const isPast = ['completed', 'cancelled'].includes(booking.status)
  const d = (booking.booking_details ?? {}) as Record<string, string>

  const subtitle = (() => {
    if (d.pickup_address && d.destination) return `${d.pickup_address} → ${d.destination}`
    const subtypeKey = d.subtype ?? d.health_subtype ?? d.legal_subtype ?? ''
    if (subtypeKey) return getSubtypeLabel(booking.service_type, subtypeKey)
    if (d.description) return d.description
    return null
  })()

  const timeStr = (() => {
    const t = d.scheduled_time ?? d.date_time ?? d.preferred_time ?? booking.requested_for
    if (!t) return null
    try {
      return new Date(t).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
    } catch { return null }
  })()

  return (
    <div style={{
      backgroundColor: 'white',
      border: expanded ? `2px solid ${cat?.color ?? '#4361ee'}` : '1px solid var(--color-warm-grey)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
      opacity: isPast ? 0.82 : 1,
      transition: 'border 0.15s',
    }}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: isPast ? '14px 20px' : '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ fontSize: isPast ? '22px' : '28px', flexShrink: 0 }} aria-hidden="true">{cat?.emoji ?? '📋'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: isPast ? '15px' : '17px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
              {cat?.title ?? booking.service_type}
            </p>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'white', backgroundColor: statusEntry.color, borderRadius: '20px', padding: '3px 10px', flexShrink: 0 }}>
              {statusEntry.label}
            </span>
          </div>
          {subtitle && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {subtitle}
            </p>
          )}
          {timeStr && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              {timeStr}
            </p>
          )}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
          {expanded ? '▲ Hide' : '▼ Details'}
        </span>
      </button>

      {expanded && <BookingDetailPanel booking={booking} />}
    </div>
  )
}

// ── Service Request Forms ──────────────────────────────────────────────────

function TransportForm({ onSuccess }: { onSuccess: (b: ServiceBooking) => void }) {
  const cat = getCategoryById('transport')!
  const [subtype, setSubtype] = useState('')
  const [pickup, setPickup] = useState('')
  const [destination, setDestination] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [wheelchair, setWheelchair] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subtype) { setError('Please select a transport type.'); return }
    if (!pickup.trim() || !destination.trim()) { setError('Please enter both pickup address and destination.'); return }
    if (!dateTime) { setError('Please select a date and time.'); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'transport',
          booking_details: { subtype, pickup_address: pickup.trim(), destination: destination.trim(), date_time: dateTime, wheelchair: wheelchair ? 'yes' : 'no' },
          requested_for: dateTime,
          notes: notes.trim() || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Unable to submit request.'); return }
      onSuccess(json.booking)
      setSubtype(''); setPickup(''); setDestination(''); setDateTime(''); setWheelchair(false); setNotes('')
    } catch { setError('Network error. Please try again.') } finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <Label htmlFor="t-subtype" required>What kind of trip?</Label>
        <select id="t-subtype" value={subtype} onChange={e => setSubtype(e.target.value)} style={INPUT} required>
          <option value="">Select trip type…</option>
          {cat.subtypes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="t-pickup" required>Pickup address</Label>
        <input id="t-pickup" type="text" value={pickup} onChange={e => setPickup(e.target.value)} placeholder="123 Main Street, City, State" style={INPUT} required />
      </div>
      <div>
        <Label htmlFor="t-dest" required>Destination</Label>
        <input id="t-dest" type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder="Doctor's office, pharmacy, grocery store…" style={INPUT} required />
      </div>
      <div>
        <Label htmlFor="t-dt" required>Date &amp; time</Label>
        <input id="t-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} required />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-navy)', cursor: 'pointer' }}>
        <input type="checkbox" checked={wheelchair} onChange={e => setWheelchair(e.target.checked)} style={{ width: '18px', height: '18px' }} />
        Wheelchair-accessible vehicle needed
      </label>
      <div>
        <Label htmlFor="t-notes">Additional notes (optional)</Label>
        <textarea id="t-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. return trip also needed, bring documentation" rows={3} style={{ ...INPUT, resize: 'vertical', minHeight: '80px' }} />
      </div>
      {error && <ErrorMsg msg={error} />}
      <SubmitBtn color={cat.color} label="Request a ride →" submitting={submitting} />
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
        A navigator will confirm availability and coordinate your ride.
      </p>
    </form>
  )
}

function HomeServiceForm({ onSuccess }: { onSuccess: (b: ServiceBooking) => void }) {
  const cat = getCategoryById('home_service')!
  const [subtype, setSubtype] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [description, setDescription] = useState('')
  const [accessNotes, setAccessNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subtype) { setError('Please select a home service type.'); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'home_service',
          booking_details: { subtype, description: description.trim() || null, preferred_time: dateTime || null, access_notes: accessNotes.trim() || null },
          requested_for: dateTime || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Unable to submit request.'); return }
      onSuccess(json.booking)
      setSubtype(''); setDateTime(''); setDescription(''); setAccessNotes('')
    } catch { setError('Network error. Please try again.') } finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <Label htmlFor="hs-subtype" required>What kind of help do you need?</Label>
        <select id="hs-subtype" value={subtype} onChange={e => setSubtype(e.target.value)} style={INPUT} required>
          <option value="">Select home service…</option>
          {cat.subtypes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="hs-dt">Preferred date &amp; time (optional)</Label>
        <input id="hs-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} />
      </div>
      <div>
        <Label htmlFor="hs-desc">What needs to be done? (optional)</Label>
        <textarea id="hs-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Any specific details that would help the provider…" rows={3} style={{ ...INPUT, resize: 'vertical', minHeight: '80px' }} />
      </div>
      <div>
        <Label htmlFor="hs-access">Access notes (optional)</Label>
        <input id="hs-access" type="text" value={accessNotes} onChange={e => setAccessNotes(e.target.value)} placeholder="e.g. key under mat, door code 1234, ring bell" style={INPUT} />
      </div>
      {error && <ErrorMsg msg={error} />}
      <SubmitBtn color={cat.color} label="Request home services →" submitting={submitting} />
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
        A navigator will coordinate a vetted provider or volunteer.
      </p>
    </form>
  )
}

function MealsForm({ onSuccess }: { onSuccess: (b: ServiceBooking) => void }) {
  const cat = getCategoryById('meals')!
  const [subtype, setSubtype] = useState('')
  const [dietaryNeeds, setDietaryNeeds] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subtype) { setError('Please select a meal service type.'); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'meals',
          booking_details: { subtype, dietary_needs: dietaryNeeds.trim() || null, delivery_address: deliveryAddress.trim() || null, preferred_time: dateTime || null },
          requested_for: dateTime || null,
          notes: notes.trim() || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Unable to submit request.'); return }
      onSuccess(json.booking)
      setSubtype(''); setDietaryNeeds(''); setDeliveryAddress(''); setDateTime(''); setNotes('')
    } catch { setError('Network error. Please try again.') } finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <Label htmlFor="m-subtype" required>What kind of meal support?</Label>
        <select id="m-subtype" value={subtype} onChange={e => setSubtype(e.target.value)} style={INPUT} required>
          <option value="">Select meal service…</option>
          {cat.subtypes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="m-diet">Dietary requirements (optional)</Label>
        <input id="m-diet" type="text" value={dietaryNeeds} onChange={e => setDietaryNeeds(e.target.value)} placeholder="e.g. diabetic-friendly, no pork, low-sodium, vegetarian" style={INPUT} />
      </div>
      <div>
        <Label htmlFor="m-addr">Delivery address (optional if same as home)</Label>
        <input id="m-addr" type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Street address for delivery…" style={INPUT} />
      </div>
      <div>
        <Label htmlFor="m-dt">Preferred date &amp; delivery window (optional)</Label>
        <input id="m-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} />
      </div>
      <div>
        <Label htmlFor="m-notes">Additional notes (optional)</Label>
        <textarea id="m-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything else the volunteer or provider should know…" rows={2} style={{ ...INPUT, resize: 'vertical', minHeight: '70px' }} />
      </div>
      {error && <ErrorMsg msg={error} />}
      <SubmitBtn color={cat.color} label="Request meal support →" submitting={submitting} />
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
        A navigator will coordinate and confirm delivery details.
      </p>
    </form>
  )
}

function HealthForm({ onSuccess }: { onSuccess: (b: ServiceBooking) => void }) {
  const cat = getCategoryById('telehealth')!
  const [subtype, setSubtype] = useState('')
  const [details, setDetails] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subtype) { setError('Please select a health service type.'); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'telehealth',
          booking_details: { health_subtype: subtype, subtype, description: details.trim() || null, preferred_time: dateTime || null },
          requested_for: dateTime || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Unable to submit request.'); return }
      onSuccess(json.booking)
      setSubtype(''); setDetails(''); setDateTime('')
    } catch { setError('Network error. Please try again.') } finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <Label htmlFor="h-subtype" required>What kind of health support?</Label>
        <select id="h-subtype" value={subtype} onChange={e => setSubtype(e.target.value)} style={INPUT} required>
          <option value="">Select health service…</option>
          {cat.subtypes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="h-details">Tell us more (optional)</Label>
        <textarea id="h-details" value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe what you need in as much or as little detail as you're comfortable sharing…" rows={3} style={{ ...INPUT, resize: 'vertical', minHeight: '90px' }} />
      </div>
      <div>
        <Label htmlFor="h-dt">Preferred date &amp; time (optional)</Label>
        <input id="h-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} />
      </div>
      {error && <ErrorMsg msg={error} />}
      <SubmitBtn color={cat.color} label="Request health support →" submitting={submitting} />
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
        A navigator will coordinate and follow up within one business day.
      </p>
    </form>
  )
}

function TechHelpForm({ onSuccess }: { onSuccess: (b: ServiceBooking) => void }) {
  const cat = getCategoryById('tech_help')!
  const [subtype, setSubtype] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('remote')
  const [dateTime, setDateTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subtype) { setError('Please select what kind of tech help you need.'); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'tech_help',
          booking_details: { subtype, description: description.trim() || null, location_preference: location, preferred_time: dateTime || null },
          requested_for: dateTime || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Unable to submit request.'); return }
      onSuccess(json.booking)
      setSubtype(''); setDescription(''); setLocation('remote'); setDateTime('')
    } catch { setError('Network error. Please try again.') } finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <Label htmlFor="th-subtype" required>What kind of tech help?</Label>
        <select id="th-subtype" value={subtype} onChange={e => setSubtype(e.target.value)} style={INPUT} required>
          <option value="">Select tech help type…</option>
          {cat.subtypes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="th-desc">What's happening? (optional)</Label>
        <textarea id="th-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue or what you'd like to learn…" rows={3} style={{ ...INPUT, resize: 'vertical', minHeight: '80px' }} />
      </div>
      <div>
        <Label htmlFor="th-loc">Would you prefer in-home or by phone?</Label>
        <select id="th-loc" value={location} onChange={e => setLocation(e.target.value)} style={INPUT}>
          <option value="remote">By phone or video call (remote)</option>
          <option value="in_home">In-home visit</option>
          <option value="no_preference">No preference</option>
        </select>
      </div>
      <div>
        <Label htmlFor="th-dt">Preferred date &amp; time (optional)</Label>
        <input id="th-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} />
      </div>
      {error && <ErrorMsg msg={error} />}
      <SubmitBtn color={cat.color} label="Request tech help →" submitting={submitting} />
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
        A volunteer tech helper will follow up to schedule.
      </p>
    </form>
  )
}

function LegalFinancialForm({ onSuccess }: { onSuccess: (b: ServiceBooking) => void }) {
  const cat = getCategoryById('legal_financial')!
  const [subtype, setSubtype] = useState('')
  const [description, setDescription] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subtype) { setError('Please select the type of support you need.'); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'legal_financial',
          booking_details: { legal_subtype: subtype, subtype, description: description.trim() || null, preferred_time: dateTime || null },
          requested_for: dateTime || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Unable to submit request.'); return }
      onSuccess(json.booking)
      setSubtype(''); setDescription(''); setDateTime('')
    } catch { setError('Network error. Please try again.') } finally { setSubmitting(false) }
  }

  return (
    <div>
      <div style={{ backgroundColor: '#f8f4ff', border: '1px solid #9d4edd', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#4a1d6d', margin: 0, lineHeight: 1.65 }}>
          <strong>Our navigators can connect you</strong> with vetted elder law attorneys, financial advisors, and benefits specialists. We never recommend specific firms — instead we provide a warm, personal introduction to appropriate professionals.
        </p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <Label htmlFor="lf-subtype" required>What kind of support do you need?</Label>
          <select id="lf-subtype" value={subtype} onChange={e => setSubtype(e.target.value)} style={INPUT} required>
            <option value="">Select service type…</option>
            {cat.subtypes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="lf-desc">Tell us more (optional)</Label>
          <textarea id="lf-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Share any relevant details that would help your navigator find the right person for you…" rows={3} style={{ ...INPUT, resize: 'vertical', minHeight: '90px' }} />
        </div>
        <div>
          <Label htmlFor="lf-dt">Preferred date &amp; time (optional)</Label>
          <input id="lf-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} />
        </div>
        {error && <ErrorMsg msg={error} />}
        <SubmitBtn color={cat.color} label="Request legal & financial support →" submitting={submitting} />
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
          A navigator will follow up within one business day.
        </p>
      </form>
    </div>
  )
}

function CompanionshipForm({ onSuccess }: { onSuccess: (b: ServiceBooking) => void }) {
  const cat = getCategoryById('companionship')!
  const [subtype, setSubtype] = useState('')
  const [description, setDescription] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subtype) { setError('Please select the type of companionship you would like.'); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'companionship',
          booking_details: { subtype, description: description.trim() || null, preferred_time: dateTime || null },
          requested_for: dateTime || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Unable to submit request.'); return }
      onSuccess(json.booking)
      setSubtype(''); setDescription(''); setDateTime('')
    } catch { setError('Network error. Please try again.') } finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <Label htmlFor="c-subtype" required>What kind of connection are you looking for?</Label>
        <select id="c-subtype" value={subtype} onChange={e => setSubtype(e.target.value)} style={INPUT} required>
          <option value="">Select companionship type…</option>
          {cat.subtypes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="c-desc">Anything you'd like to share? (optional)</Label>
        <textarea id="c-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Interests, preferences, or anything that would help us find a great match…" rows={3} style={{ ...INPUT, resize: 'vertical', minHeight: '80px' }} />
      </div>
      <div>
        <Label htmlFor="c-dt">Preferred date &amp; time (optional)</Label>
        <input id="c-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} />
      </div>
      {error && <ErrorMsg msg={error} />}
      <SubmitBtn color={cat.color} label="Request a companion →" submitting={submitting} />
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
        A navigator will match you with a caring volunteer.
      </p>
    </form>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

type ServiceCategoryId = (typeof SERVICE_CATEGORIES)[number]['id'] | null

interface Props {
  initialBookings: ServiceBooking[]
}

export default function ServicesClient({ initialBookings }: Props) {
  const [activeCategory, setActiveCategory] = useState<ServiceCategoryId>(null)
  const [bookings, setBookings] = useState<ServiceBooking[]>(initialBookings)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function handleSuccess(booking: ServiceBooking) {
    setBookings((prev) => [booking, ...prev])
    const cat = getCategoryById(booking.service_type)
    setSuccessMessage(`Your ${cat?.title ?? booking.service_type} request has been submitted. A navigator will be in touch soon.`)
    setActiveCategory(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const upcomingBookings = bookings.filter((b) => ['requested', 'confirmed', 'in_progress'].includes(b.status))
  const pastBookings = bookings.filter((b) => ['completed', 'cancelled'].includes(b.status))
  const activeData = activeCategory ? getCategoryById(activeCategory) : null

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
            Coordinated support for everyday needs — transport, home help, meals, health, companionship, and more.
          </p>
        </div>
      </div>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
        {/* Success banner */}
        {successMessage && (
          <div role="status" style={{ backgroundColor: '#d1fae5', border: '1.5px solid #43aa8b', borderRadius: 'var(--radius-xl)', padding: '16px 20px', marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#1a4d3a', margin: 0, fontWeight: 500 }}>✓ {successMessage}</p>
            <button onClick={() => setSuccessMessage(null)} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#1a4d3a', padding: '4px', lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>
        )}

        {/* Upcoming services */}
        {upcomingBookings.length > 0 && (
          <section style={{ marginTop: '40px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>
              Upcoming services
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: '0 0 16px' }}>
              Tap any service to see details.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
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
            {SERVICE_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(isActive ? null : cat.id)}
                  aria-expanded={isActive}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: '24px', backgroundColor: isActive ? `${cat.color}12` : 'white', border: isActive ? `2px solid ${cat.color}` : '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-xl)', cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow-card)', transition: 'all 0.2s', minHeight: '120px' }}
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
            @media (min-width: 900px) { .services-grid { grid-template-columns: repeat(4, 1fr) !important; } }
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
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
                  {activeData.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  {activeData.description}
                </p>
              </div>
            </div>

            {activeCategory === 'transport' && <TransportForm onSuccess={handleSuccess} />}
            {activeCategory === 'home_service' && <HomeServiceForm onSuccess={handleSuccess} />}
            {activeCategory === 'meals' && <MealsForm onSuccess={handleSuccess} />}
            {activeCategory === 'telehealth' && <HealthForm onSuccess={handleSuccess} />}
            {activeCategory === 'tech_help' && <TechHelpForm onSuccess={handleSuccess} />}
            {activeCategory === 'legal_financial' && <LegalFinancialForm onSuccess={handleSuccess} />}
            {activeCategory === 'companionship' && <CompanionshipForm onSuccess={handleSuccess} />}
          </section>
        )}

        {/* Past services */}
        {pastBookings.length > 0 && (
          <section style={{ marginTop: '56px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-warm-grey)' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-text-secondary)', margin: 0, flexShrink: 0 }}>
                Service history
              </h2>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-warm-grey)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {bookings.length === 0 && !activeCategory && (
          <div style={{ marginTop: '40px', textAlign: 'center', padding: '48px 24px', backgroundColor: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-warm-grey)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: '40px', margin: '0 0 16px' }} aria-hidden="true">🤝</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', margin: '0 0 8px', fontWeight: 500 }}>No services yet</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Choose a category above to request coordinated support for your loved one.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
