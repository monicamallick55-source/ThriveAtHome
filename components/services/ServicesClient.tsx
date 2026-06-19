'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ServiceBooking } from '@/lib/data/services'
import { SERVICE_CATEGORIES, STATUS_INFO, DISPATCH_TYPE_LABELS, getCategoryById, getSubtypeLabel } from '@/lib/services/serviceTypes'

// ── Companion types ───────────────────────────────────────────────────────
interface Companion {
  id: string
  full_name: string
  bio: string | null
  hourly_rate: number
  service_types: string[]
  languages: string[]
  city: string | null
  state: string | null
  rating_average: number | null
  total_sessions: number
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  in_person: 'In-person visit',
  video: 'Video call',
  phone: 'Phone call',
}

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

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SHORT_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDateTime(val: string | undefined): string {
  if (!val) return ''
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    const h = d.getUTCHours()
    const min = d.getUTCMinutes().toString().padStart(2, '0')
    const ampm = h < 12 ? 'AM' : 'PM'
    const h12 = h % 12 || 12
    return `${DAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} at ${h12}:${min} ${ampm}`
  } catch { return val }
}

function formatDateTimeShort(val: string | undefined | null): string {
  if (!val) return ''
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    const h = d.getUTCHours()
    const min = d.getUTCMinutes().toString().padStart(2, '0')
    const ampm = h < 12 ? 'AM' : 'PM'
    const h12 = h % 12 || 12
    return `${SHORT_DAYS[d.getUTCDay()]}, ${SHORT_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()} at ${h12}:${min} ${ampm}`
  } catch { return val }
}

function validateFutureDateTime(dt: string): string | null {
  if (!dt) return 'Please select a date and time.'
  const d = new Date(dt)
  if (isNaN(d.getTime())) return 'Please enter a valid date and time.'
  if (d <= new Date()) return 'Please select a future date and time — this date has already passed.'
  return null
}

function DetailRow({ label, value, isDate }: { label: string; value: React.ReactNode; isDate?: boolean }) {
  if (!value) return null
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 2px' }}>
        {label}
      </p>
      <p suppressHydrationWarning={isDate} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.4 }}>
        {value}
      </p>
    </div>
  )
}

function BookingDetailPanel({ booking }: { booking: ServiceBooking }) {
  const d = (booking.booking_details ?? {}) as Record<string, string>
  const catRaw = getCategoryById(booking.service_type)
  const cat = catRaw ?? (booking.service_type === 'companion' ? { emoji: '💜', title: 'Companion Session', color: '#9d4edd', id: 'companion', description: '', subtypes: [] } : undefined)
  const statusEntry = STATUS_INFO[booking.status]

  const rows: { label: string; value: React.ReactNode; isDate?: boolean }[] = []

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
    if (time) rows.push({ label: 'Scheduled pickup', value: formatDateTime(time), isDate: true })
    if (d.assigned_volunteer) rows.push({ label: 'Your driver / volunteer', value: d.assigned_volunteer })
    if (d.wheelchair === 'yes') rows.push({ label: 'Accessibility', value: 'Wheelchair-accessible vehicle requested' })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else if (booking.service_type === 'home_service') {
    const time = d.scheduled_time ?? d.preferred_time
    if (time) rows.push({ label: 'Scheduled date & time', value: formatDateTime(time), isDate: true })
    if (d.assigned_provider) rows.push({ label: 'Provider', value: d.assigned_provider })
    if (d.assigned_volunteer) rows.push({ label: 'Volunteer helper', value: d.assigned_volunteer })
    if (d.description) rows.push({ label: 'Details requested', value: d.description })
    if (d.access_notes) rows.push({ label: 'Access notes', value: d.access_notes })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else if (booking.service_type === 'meals') {
    const time = d.scheduled_time ?? d.preferred_time
    if (d.delivery_address) rows.push({ label: 'Delivery address', value: d.delivery_address })
    if (d.dietary_needs) rows.push({ label: 'Dietary requirements', value: d.dietary_needs })
    if (time) rows.push({ label: 'Delivery window', value: formatDateTime(time), isDate: true })
    if (d.assigned_volunteer) rows.push({ label: 'Volunteer', value: d.assigned_volunteer })
    if (d.assigned_provider) rows.push({ label: 'Provider', value: d.assigned_provider })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else if (booking.service_type === 'telehealth') {
    const time = d.scheduled_time ?? d.preferred_time
    if (time) rows.push({ label: 'Appointment time', value: formatDateTime(time), isDate: true })
    if (d.assigned_provider) rows.push({ label: 'Provider', value: d.assigned_provider })
    if (d.arrangement) rows.push({ label: 'How to join', value: d.arrangement })
    if (d.description) rows.push({ label: 'Details shared', value: d.description })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else if (booking.service_type === 'tech_help') {
    if (d.description) rows.push({ label: 'What you need help with', value: d.description })
    if (d.location_preference) rows.push({ label: 'In-home or remote', value: d.location_preference === 'in_home' ? 'In-home visit' : 'Remote / by phone' })
    const time = d.scheduled_time ?? d.preferred_time
    if (time) rows.push({ label: 'Scheduled time', value: formatDateTime(time), isDate: true })
    if (d.assigned_volunteer) rows.push({ label: 'Volunteer tech helper', value: d.assigned_volunteer })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else if (booking.service_type === 'legal_financial') {
    const time = d.scheduled_time ?? d.preferred_time
    if (time) rows.push({ label: 'Appointment time', value: formatDateTime(time), isDate: true })
    if (d.assigned_provider) rows.push({ label: 'Provider name', value: d.assigned_provider })
    if (d.provider_phone) rows.push({ label: 'Provider contact', value: d.provider_phone })
    if (d.description) rows.push({ label: 'Details shared', value: d.description })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else if (booking.service_type === 'companionship') {
    const time = d.scheduled_time ?? d.preferred_time
    if (time) rows.push({ label: 'Scheduled visit', value: formatDateTime(time), isDate: true })
    if (d.assigned_volunteer) rows.push({ label: 'Your volunteer', value: d.assigned_volunteer })
    if (d.description) rows.push({ label: 'Notes', value: d.description })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else if (booking.service_type === 'companion') {
    if (d.companion_name) rows.push({ label: 'Companion', value: d.companion_name })
    if (d.session_type) rows.push({ label: 'Session type', value: SESSION_TYPE_LABELS[d.session_type] ?? d.session_type })
    const time = d.scheduled_time ?? d.preferred_time
    if (time) rows.push({ label: 'Scheduled time', value: formatDateTime(time), isDate: true })
    if (d.hourly_rate) rows.push({ label: 'Rate', value: `$${d.hourly_rate}/hour` })
    if (d.notes) rows.push({ label: 'Your notes', value: d.notes })
  } else if (booking.service_type === 'travel_assistance') {
    if (d.destination) rows.push({ label: 'Destination', value: d.destination })
    if (d.travel_dates) rows.push({ label: 'Travel dates', value: d.travel_dates })
    const time = d.scheduled_time ?? d.preferred_time
    if (time) rows.push({ label: 'Navigator follow-up', value: formatDateTime(time), isDate: true })
    if (d.assigned_provider) rows.push({ label: 'Travel agent', value: d.assigned_provider })
    if (d.assigned_volunteer) rows.push({ label: 'Travel companion', value: d.assigned_volunteer })
    if (d.description) rows.push({ label: 'Details', value: d.description })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
  } else if (booking.service_type === 'roadside') {
    if (d.subtype) rows.push({ label: 'Type of help', value: d.subtype.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) })
    if (d.aaa_membership_info) rows.push({ label: 'AAA on file', value: d.aaa_membership_info })
    if (d.insurance_roadside_info) rows.push({ label: 'Car insurance', value: d.insurance_roadside_info })
    if (d.description) rows.push({ label: 'Details', value: d.description })
    if (d.dispatch_type) rows.push({ label: 'Arranged via', value: DISPATCH_TYPE_LABELS[d.dispatch_type] ?? d.dispatch_type })
    if (d.assigned_provider) rows.push({ label: 'Provider', value: d.assigned_provider })
    if (d.arrangement) rows.push({ label: 'Arrangement', value: d.arrangement })
  } else {
    const time = d.scheduled_time ?? d.preferred_time ?? d.date_time
    if (time) rows.push({ label: 'Scheduled time', value: formatDateTime(time), isDate: true })
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
            <DetailRow key={i} label={row.label} value={row.value} isDate={row.isDate} />
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

function BookingCard({ booking, onCancelled }: { booking: ServiceBooking; onCancelled?: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [cancelStep, setCancelStep] = useState<'idle' | 'confirm' | 'cancelling'>('idle')
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [ratedStars, setRatedStars] = useState<number | null>(null)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)

  const catRaw = getCategoryById(booking.service_type)
  const cat = catRaw ?? (booking.service_type === 'companion' ? { emoji: '💜', title: 'Companion Session', color: '#9d4edd', id: 'companion', description: '', subtypes: [] } : undefined)
  const statusEntry = STATUS_INFO[booking.status] ?? { label: booking.status, color: '#adb5bd', description: '' }
  const isPast = ['completed', 'cancelled'].includes(booking.status)
  const d = (booking.booking_details ?? {}) as Record<string, string>

  const subtitle = (() => {
    if (d.pickup_address && d.destination) return `${d.pickup_address} → ${d.destination}`
    if (booking.service_type === 'companion') {
      const parts = [d.companion_name, d.session_type ? SESSION_TYPE_LABELS[d.session_type] : null].filter(Boolean)
      return parts.join(' — ') || null
    }
    const subtypeKey = d.subtype ?? d.health_subtype ?? d.legal_subtype ?? ''
    if (subtypeKey) return getSubtypeLabel(booking.service_type, subtypeKey)
    if (d.description) return d.description
    return null
  })()

  const timeStr = formatDateTimeShort(d.scheduled_time ?? d.date_time ?? d.preferred_time ?? booking.requested_for ?? undefined) || null

  // Can the member cancel this booking?
  const { canCancel, cancelBlockedReason } = (() => {
    if (!onCancelled || isPast) return { canCancel: false, cancelBlockedReason: null }
    if (booking.status === 'in_progress') return { canCancel: false, cancelBlockedReason: null }
    if (booking.status === 'confirmed') {
      const scheduledTime = d.scheduled_time ?? d.date_time ?? d.preferred_time ?? booking.requested_for
      if (scheduledTime) {
        const hoursUntil = (new Date(scheduledTime as string).getTime() - Date.now()) / (1000 * 60 * 60)
        if (hoursUntil < 4) {
          return { canCancel: false, cancelBlockedReason: 'Your service is less than 4 hours away. To cancel, please contact your navigator.' }
        }
      }
    }
    return { canCancel: true, cancelBlockedReason: null }
  })()

  async function submitRating(stars: number) {
    const d = (booking.booking_details ?? {}) as Record<string, string>
    const companionId = d.companion_id
    if (!companionId) { setRatingError('Unable to identify companion.'); return }
    setRatedStars(stars)
    try {
      await fetch(`/api/companions/${companionId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: stars }),
      })
      setRatingSubmitted(true)
    } catch { setRatingError('Could not submit rating. Please try again.') }
  }

  async function submitCancel() {
    setCancelStep('cancelling')
    setCancelError(null)
    try {
      const res = await fetch(`/api/services/${booking.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel_reason: cancelReason.trim() || null }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCancelError(json.error ?? 'Unable to cancel. Please contact your navigator.')
        setCancelStep('confirm')
        return
      }
      onCancelled?.(booking.id)
    } catch {
      setCancelError('Network error. Please try again.')
      setCancelStep('confirm')
    }
  }

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
            <p suppressHydrationWarning style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              {timeStr}
            </p>
          )}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
          {expanded ? '▲ Hide' : '▼ Details'}
        </span>
      </button>

      {expanded && <BookingDetailPanel booking={booking} />}

      {/* Member cancel section */}
      {expanded && (canCancel || cancelBlockedReason) && (
        <div style={{ borderTop: '1px solid var(--color-warm-grey)', padding: '14px 24px', backgroundColor: '#fafaf8' }}>
          {cancelBlockedReason && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#78350f', margin: 0 }}>
              {cancelBlockedReason}
            </p>
          )}
          {canCancel && cancelStep === 'idle' && (
            <button
              onClick={() => setCancelStep('confirm')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#dc2626', textDecoration: 'underline', padding: 0 }}
            >
              Cancel this request
            </button>
          )}
          {canCancel && cancelStep === 'confirm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', margin: 0 }}>
                Are you sure you want to cancel this request?
              </p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Reason for cancelling (optional)"
                rows={2}
                style={{ ...INPUT, resize: 'vertical', minHeight: '60px', fontSize: '14px' }}
              />
              {cancelError && <ErrorMsg msg={cancelError} />}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={submitCancel}
                  style={{ flex: 1, padding: '12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Yes, cancel request
                </button>
                <button
                  onClick={() => { setCancelStep('idle'); setCancelReason(''); setCancelError(null) }}
                  style={{ flex: 1, padding: '12px', backgroundColor: 'white', color: 'var(--color-navy)', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Keep it
                </button>
              </div>
            </div>
          )}
          {canCancel && cancelStep === 'cancelling' && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Cancelling…
            </p>
          )}
        </div>
      )}

      {/* Rating prompt for completed companion bookings */}
      {expanded && booking.service_type === 'companion' && booking.status === 'completed' && (
        <div style={{ borderTop: '1px solid var(--color-warm-grey)', padding: '16px 24px', backgroundColor: '#fafaf8' }}>
          {ratingSubmitted ? (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#065f46', fontWeight: 500, margin: 0 }}>
              ✓ Thank you for your feedback — it helps us match the best companions.
            </p>
          ) : (
            <>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 10px' }}>
                How was your session?
              </p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: ratingError ? '8px' : 0 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => submitRating(star)}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '28px', color: ratedStars && star <= ratedStars ? '#f59e0b' : '#d1d5db', padding: '4px', lineHeight: 1 }}
                  >
                    ★
                  </button>
                ))}
              </div>
              {ratingError && <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#dc2626', margin: '4px 0 0' }}>{ratingError}</p>}
            </>
          )}
        </div>
      )}
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
    const dtErr = validateFutureDateTime(dateTime)
    if (dtErr) { setError(dtErr); return }
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
    const dtErr = validateFutureDateTime(dateTime)
    if (dtErr) { setError(dtErr); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'home_service',
          booking_details: { subtype, description: description.trim() || null, preferred_time: dateTime, access_notes: accessNotes.trim() || null },
          requested_for: dateTime,
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
        <Label htmlFor="hs-dt" required>Preferred date &amp; time</Label>
        <input id="hs-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} required />
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
  const [groceryList, setGroceryList] = useState<string | null>(null)

  function generateGroceryList() {
    const prefs = dietaryNeeds.trim()
    const base = [
      '• Whole grain bread or rolls',
      '• Fresh vegetables (broccoli, carrots, spinach, sweet potato)',
      '• Fresh fruit (apples, bananas, oranges)',
      '• Lean protein (chicken, fish, eggs)',
      '• Low-sodium canned goods (beans, tomatoes)',
      '• Low-fat dairy (milk, yogurt, cheese)',
      '• Healthy snacks (nuts, peanut butter)',
    ]
    const note = prefs ? `\n\nNote: adjusted for your preferences (${prefs}).` : ''
    setGroceryList(`[STUB] Suggested grocery list:\n${base.join('\n')}${note}\n\nA navigator will review and confirm your actual order.`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subtype) { setError('Please select a meal service type.'); return }
    const dtErr = validateFutureDateTime(dateTime)
    if (dtErr) { setError(dtErr); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'meals',
          booking_details: { subtype, dietary_needs: dietaryNeeds.trim() || null, delivery_address: deliveryAddress.trim() || null, preferred_time: dateTime },
          requested_for: dateTime,
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
        <button
          type="button"
          onClick={generateGroceryList}
          style={{ marginTop: '8px', background: 'none', border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '7px 14px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
        >
          Generate suggested grocery list
        </button>
        {groceryList && (
          <pre style={{ marginTop: '10px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '13px', color: '#1a4d3a', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: '10px 0 0' }}>
            {groceryList}
          </pre>
        )}
      </div>
      <div>
        <Label htmlFor="m-addr">Delivery address (optional if same as home)</Label>
        <input id="m-addr" type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Street address for delivery…" style={INPUT} />
      </div>
      <div>
        <Label htmlFor="m-dt" required>Preferred date &amp; delivery window</Label>
        <input id="m-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} required />
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
    const dtErr = validateFutureDateTime(dateTime)
    if (dtErr) { setError(dtErr); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'telehealth',
          booking_details: { health_subtype: subtype, subtype, description: details.trim() || null, preferred_time: dateTime },
          requested_for: dateTime,
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
        <Label htmlFor="h-dt" required>Preferred date &amp; time</Label>
        <input id="h-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} required />
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
    const dtErr = validateFutureDateTime(dateTime)
    if (dtErr) { setError(dtErr); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'tech_help',
          booking_details: { subtype, description: description.trim() || null, location_preference: location, preferred_time: dateTime },
          requested_for: dateTime,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Unable to submit request.'); return }
      onSuccess(json.booking)
      setSubtype(''); setDescription(''); setLocation('remote'); setDateTime('')
    } catch { setError('Network error. Please try again.') } finally { setSubmitting(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Tech helpline banner */}
      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: '#065f46', margin: '0 0 2px' }}>
            📞 Need help right now?
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#047857', margin: 0 }}>
            Call our Tech Helpline: <strong>(555) 987-6543</strong> — Mon–Fri 9am–5pm
          </p>
        </div>
        <a
          href="/dashboard/tech-tutorials"
          style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: '#2b9348', textDecoration: 'none', whiteSpace: 'nowrap', padding: '8px 16px', backgroundColor: 'white', border: '1.5px solid #86efac', borderRadius: 'var(--radius-md)' }}
        >
          📚 Video tutorials →
        </a>
      </div>
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
        <Label htmlFor="th-dt" required>Preferred date &amp; time</Label>
        <input id="th-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} required />
      </div>
      {error && <ErrorMsg msg={error} />}
      <SubmitBtn color={cat.color} label="Request tech help →" submitting={submitting} />
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
        A volunteer tech helper will follow up to schedule.
      </p>
    </form>
    </div>
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
    const dtErr = validateFutureDateTime(dateTime)
    if (dtErr) { setError(dtErr); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'legal_financial',
          booking_details: { legal_subtype: subtype, subtype, description: description.trim() || null, preferred_time: dateTime },
          requested_for: dateTime,
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
          <Label htmlFor="lf-dt" required>Preferred date &amp; time</Label>
          <input id="lf-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} required />
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
    const dtErr = validateFutureDateTime(dateTime)
    if (dtErr) { setError(dtErr); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'companionship',
          booking_details: { subtype, description: description.trim() || null, preferred_time: dateTime },
          requested_for: dateTime,
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
        <Label htmlFor="c-dt" required>Preferred date &amp; time</Label>
        <input id="c-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} required />
      </div>
      {error && <ErrorMsg msg={error} />}
      <SubmitBtn color={cat.color} label="Request a companion →" submitting={submitting} />
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
        A navigator will match you with a caring volunteer.
      </p>
    </form>
  )
}

// ── Travel Assistance Form ────────────────────────────────────────────────

function TravelAssistanceForm({ onSuccess }: { onSuccess: (b: ServiceBooking) => void }) {
  const cat = getCategoryById('travel_assistance')!
  const [subtype, setSubtype] = useState('')
  const [destination, setDestination] = useState('')
  const [travelDates, setTravelDates] = useState('')
  const [description, setDescription] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTravelCompanion = subtype === 'travel_companion'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subtype) { setError('Please select the type of travel assistance you need.'); return }
    const dtErr = validateFutureDateTime(dateTime)
    if (dtErr) { setError(dtErr); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'travel_assistance',
          booking_details: {
            subtype,
            destination: destination.trim() || null,
            travel_dates: travelDates.trim() || null,
            description: description.trim() || null,
            preferred_time: dateTime,
          },
          requested_for: dateTime,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Unable to submit request.'); return }
      onSuccess(json.booking)
      setSubtype(''); setDestination(''); setTravelDates(''); setDescription(''); setDateTime('')
    } catch { setError('Network error. Please try again.') } finally { setSubmitting(false) }
  }

  return (
    <div>
      <div style={{ backgroundColor: '#e0f2fe', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '20px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#075985', margin: 0, lineHeight: 1.65 }}>
          <strong>Your navigator coordinates travel.</strong> For bookings, they connect you with a vetted travel agent or help your family book directly. Travel companion requests are matched with volunteers or paid companions willing to travel.
        </p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <Label htmlFor="ta-subtype" required>What kind of travel help do you need?</Label>
          <select id="ta-subtype" value={subtype} onChange={e => setSubtype(e.target.value)} style={INPUT} required>
            <option value="">Select travel assistance type…</option>
            {cat.subtypes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        {isTravelCompanion && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#065f46', margin: 0, lineHeight: 1.6 }}>
              We will match you with a volunteer or paid companion willing to travel. Your navigator will confirm availability before finalising.
            </p>
          </div>
        )}
        <div>
          <Label htmlFor="ta-dest">Destination (optional)</Label>
          <input id="ta-dest" type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. San Diego, CA or Florida" style={INPUT} />
        </div>
        <div>
          <Label htmlFor="ta-dates">Travel dates (optional)</Label>
          <input id="ta-dates" type="text" value={travelDates} onChange={e => setTravelDates(e.target.value)} placeholder="e.g. July 12–19, 2026 or TBD" style={INPUT} />
        </div>
        <div>
          <Label htmlFor="ta-desc">Tell us more (optional)</Label>
          <textarea id="ta-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Any relevant details — mobility needs, travel preferences, number of travellers…" rows={3} style={{ ...INPUT, resize: 'vertical', minHeight: '80px' }} />
        </div>
        <div>
          <Label htmlFor="ta-dt" required>When would you like us to reach out?</Label>
          <input id="ta-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} required />
        </div>
        {error && <ErrorMsg msg={error} />}
        <SubmitBtn color={cat.color} label="Request travel assistance →" submitting={submitting} />
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
          A navigator will follow up within one business day.
        </p>
      </form>
    </div>
  )
}

function RoadsideForm({ onSuccess }: { onSuccess: (b: ServiceBooking) => void }) {
  const cat = getCategoryById('roadside')!
  const [subtype, setSubtype] = useState('')
  const [description, setDescription] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aaaPrefill, setAaaPrefill] = useState<string | null>(null)
  const [insurancePrefill, setInsurancePrefill] = useState<string | null>(null)

  // Fetch tracked_items on mount to pre-fill membership info
  useEffect(() => {
    fetch('/api/tracked-items')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (!json?.items) return
        const aaa = json.items.find((i: { item_type: string; status: string; item_name?: string; renewal_contact_info?: string }) => i.item_type === 'aaa_membership' && i.status === 'active')
        const car = json.items.find((i: { item_type: string; status: string; item_name?: string; renewal_contact_info?: string }) => i.item_type === 'car_insurance' && i.status === 'active')
        if (aaa) setAaaPrefill(`${aaa.item_name ?? 'AAA Membership'}${aaa.renewal_contact_info ? ` — ${aaa.renewal_contact_info}` : ''}`)
        if (car) setInsurancePrefill(`${car.item_name ?? 'Car Insurance'}${car.renewal_contact_info ? ` — ${car.renewal_contact_info}` : ''}`)
      })
      .catch(() => null)
  }, [])

  const isEmergency = subtype === 'other_roadside'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subtype) { setError('Please select the type of roadside help you need.'); return }
    const dtErr = validateFutureDateTime(dateTime)
    if (dtErr) { setError(dtErr); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'roadside',
          booking_details: {
            subtype,
            description: description.trim() || null,
            aaa_membership_info: aaaPrefill ?? null,
            insurance_roadside_info: insurancePrefill ?? null,
          },
          requested_for: dateTime,
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
      {/* Pre-fill banners */}
      {aaaPrefill && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: '12px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#065f46', margin: 0, lineHeight: 1.6 }}>
            🛣️ <strong>AAA membership on file:</strong> {aaaPrefill} — your navigator will use this.
          </p>
        </div>
      )}
      {insurancePrefill && (
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: '12px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#1e40af', margin: 0, lineHeight: 1.6 }}>
            🚗 <strong>Car insurance on file:</strong> {insurancePrefill} — may include roadside coverage.
          </p>
        </div>
      )}
      {isEmergency && (
        <div style={{ backgroundColor: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: '12px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#b91c1c', margin: 0, lineHeight: 1.6, fontWeight: 600 }}>
            ⚠️ Emergency roadside — a navigator will be notified immediately.
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <Label htmlFor="rs-subtype" required>What do you need?</Label>
          <select id="rs-subtype" value={subtype} onChange={e => setSubtype(e.target.value)} style={INPUT} required>
            <option value="">Select roadside help type…</option>
            {cat.subtypes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="rs-desc">Tell us more (optional)</Label>
          <textarea id="rs-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Your location, what happened, any details that will help your navigator…" rows={3} style={{ ...INPUT, resize: 'vertical', minHeight: '80px' }} />
        </div>
        <div>
          <Label htmlFor="rs-dt" required>When do you need help?</Label>
          <input id="rs-dt" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} required />
        </div>
        {error && <ErrorMsg msg={error} />}
        <SubmitBtn color={cat.color} label={isEmergency ? 'Request emergency roadside help →' : 'Request roadside help →'} submitting={submitting} />
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
          Your navigator will coordinate using your AAA membership or car insurance coverage where available.
        </p>
      </form>
    </div>
  )
}

// ── Companion Marketplace ────────────────────────────────────────────────

const COMPANION_SERVICE_LABELS: Record<string, string> = {
  in_person_visit: 'In-person visits',
  phone_call: 'Phone calls',
  walking_companion: 'Walking companion',
  reading_aloud: 'Reading aloud',
  grocery_help: 'Grocery help',
}

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>New</span>
  const full = Math.round(rating)
  return (
    <span aria-label={`${rating} out of 5 stars`} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= full ? '#f59e0b' : '#d1d5db', fontSize: '14px' }}>★</span>
      ))}
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginLeft: '4px' }}>{rating.toFixed(1)}</span>
    </span>
  )
}

function BookCompanionForm({ companion, onSuccess, onCancel }: { companion: Companion; onSuccess: (b: ServiceBooking) => void; onCancel: () => void }) {
  const [sessionType, setSessionType] = useState('in_person')
  const [dateTime, setDateTime] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const dtErr = validateFutureDateTime(dateTime)
    if (dtErr) { setError(dtErr); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'companion',
          booking_details: {
            companion_id: companion.id,
            companion_name: companion.full_name,
            session_type: sessionType,
            hourly_rate: companion.hourly_rate,
            preferred_time: dateTime,
            notes: notes.trim() || null,
          },
          requested_for: dateTime,
          notes: notes.trim() || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Unable to submit booking.'); return }
      onSuccess(json.booking)
    } catch { setError('Network error. Please try again.') } finally { setSubmitting(false) }
  }

  return (
    <div style={{ backgroundColor: '#f8f4ff', border: '1.5px solid #9d4edd', borderRadius: 'var(--radius-xl)', padding: '24px', marginTop: '12px' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 16px' }}>
        Book a session with {companion.full_name}
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <Label htmlFor={`st-${companion.id}`} required>Session type</Label>
          <select id={`st-${companion.id}`} value={sessionType} onChange={e => setSessionType(e.target.value)} style={INPUT}>
            <option value="in_person">In-person visit</option>
            <option value="phone">Phone call</option>
            <option value="video">Video call</option>
          </select>
        </div>
        <div>
          <Label htmlFor={`dt-${companion.id}`} required>Date &amp; time</Label>
          <input id={`dt-${companion.id}`} type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={INPUT} required />
        </div>
        <div>
          <Label htmlFor={`nt-${companion.id}`}>Notes (optional)</Label>
          <textarea id={`nt-${companion.id}`} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything you'd like to share with your companion…" rows={2} style={{ ...INPUT, resize: 'vertical', minHeight: '70px' }} />
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Rate: <strong>${companion.hourly_rate}/hour</strong> — billed after your session. Stripe Connect setup required for live payments.
        </p>
        {error && <ErrorMsg msg={error} />}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{ flex: 1, padding: '14px 20px', backgroundColor: '#9d4edd', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, minHeight: '52px' }}
          >
            {submitting ? 'Booking…' : 'Confirm booking →'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '14px 20px', backgroundColor: 'white', color: 'var(--color-navy)', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 500, cursor: 'pointer', minHeight: '52px' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function CompanionCard({ companion, onBooked }: { companion: Companion; onBooked: (b: ServiceBooking) => void }) {
  const [showForm, setShowForm] = useState(false)

  function handleBooked(booking: ServiceBooking) {
    setShowForm(false)
    onBooked(booking)
  }

  const locationStr = [companion.city, companion.state].filter(Boolean).join(', ')
  const serviceLabels = companion.service_types
    .map(s => COMPANION_SERVICE_LABELS[s] ?? s)
    .slice(0, 3)

  return (
    <div style={{ backgroundColor: 'white', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
      <div style={{ padding: '24px 24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 4px' }}>
              {companion.full_name}
            </p>
            {locationStr && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                📍 {locationStr}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: '#9d4edd', margin: '0 0 4px' }}>
              ${companion.hourly_rate}<span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--color-text-secondary)' }}>/hr</span>
            </p>
            <StarDisplay rating={companion.rating_average} />
          </div>
        </div>

        {companion.bio && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-primary)', margin: '0 0 14px', lineHeight: 1.65 }}>
            {companion.bio}
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          {serviceLabels.map((label) => (
            <span key={label} style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, color: '#9d4edd', backgroundColor: '#f8f4ff', border: '1px solid #e9d5ff', borderRadius: '20px', padding: '3px 10px' }}>
              {label}
            </span>
          ))}
          {companion.languages.filter(l => l !== 'english').map(lang => (
            <span key={lang} style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, color: '#1d4ed8', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '3px 10px' }}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)} speaker
            </span>
          ))}
          {companion.total_sessions > 0 && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '3px 10px' }}>
              {companion.total_sessions} sessions completed
            </span>
          )}
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          aria-expanded={showForm}
          style={{ width: '100%', padding: '14px 20px', backgroundColor: showForm ? 'white' : '#9d4edd', color: showForm ? '#9d4edd' : 'white', border: showForm ? '1.5px solid #9d4edd' : 'none', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', minHeight: '52px' }}
        >
          {showForm ? 'Close' : '💜 Book a session'}
        </button>
      </div>

      {showForm && (
        <div style={{ padding: '0 24px 24px' }}>
          <BookCompanionForm companion={companion} onSuccess={handleBooked} onCancel={() => setShowForm(false)} />
        </div>
      )}
    </div>
  )
}

function CompanionMarketplaceSection({ onBooked }: { onBooked: (b: ServiceBooking) => void }) {
  const [companions, setCompanions] = useState<Companion[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  async function load() {
    if (companions !== null) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/companions')
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Unable to load companions.'); return }
      setCompanions(json.companions ?? [])
    } catch { setError('Network error. Please try again.') } finally { setLoading(false) }
  }

  function handleOpen() {
    const next = !isOpen
    setIsOpen(next)
    if (next) load()
  }

  return (
    <section style={{ marginTop: '48px' }}>
      <button
        onClick={handleOpen}
        aria-expanded={isOpen}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '28px 32px', backgroundColor: 'white', border: isOpen ? '2px solid #9d4edd' : '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '36px', lineHeight: 1 }} aria-hidden="true">💜</span>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: isOpen ? '#9d4edd' : 'var(--color-navy)', margin: 0 }}>
              Companion Marketplace
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
              Vetted paid companions for in-person visits, phone calls, and more
            </p>
          </div>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
          {isOpen ? '▲ Close' : '▼ Browse companions'}
        </span>
      </button>

      {isOpen && (
        <div style={{ marginTop: '16px' }}>
          {loading && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '32px' }}>
              Loading companions…
            </p>
          )}
          {error && (
            <div style={{ padding: '16px 20px', backgroundColor: '#fff0f0', border: '1px solid #e63946', borderRadius: 'var(--radius-xl)' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#dc2626', margin: 0 }}>{error}</p>
            </div>
          )}
          {companions && companions.length === 0 && !loading && (
            <div style={{ padding: '48px 24px', backgroundColor: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-warm-grey)', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 8px' }}>No companions available yet</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Contact your navigator to request a companion — we are actively recruiting in your area.
              </p>
            </div>
          )}
          {companions && companions.length > 0 && (
            <>
              <div style={{ backgroundColor: '#f8f4ff', border: '1px solid #e9d5ff', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: '20px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#4a1d6d', margin: 0, lineHeight: 1.6 }}>
                  <strong>How it works:</strong> Browse companions below, choose a session type and time, and your navigator will confirm the booking. Payment is collected after the session. All companions are background-checked and trained.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="companion-grid">
                {companions.map((c) => (
                  <CompanionCard key={c.id} companion={c} onBooked={onBooked} />
                ))}
              </div>
              <style>{`@media (min-width: 700px) { .companion-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
            </>
          )}
        </div>
      )}
    </section>
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

  function handleCancelled(id: string) {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' as const } : b))
    setSuccessMessage('Your service request has been cancelled.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCompanionBooked(booking: ServiceBooking) {
    setBookings((prev) => [booking, ...prev])
    setSuccessMessage('Your companion session has been requested. A navigator will confirm the details shortly.')
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
                <BookingCard key={booking.id} booking={booking} onCancelled={handleCancelled} />
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
            {activeCategory === 'travel_assistance' && <TravelAssistanceForm onSuccess={handleSuccess} />}
            {activeCategory === 'roadside' && <RoadsideForm onSuccess={handleSuccess} />}
          </section>
        )}

        {/* Companion Marketplace */}
        <CompanionMarketplaceSection onBooked={handleCompanionBooked} />

        {/* Fraud & scam awareness */}
        <section style={{ marginTop: '48px', backgroundColor: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: 'var(--radius-xl)', padding: '28px 32px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: '#92400e', margin: '0 0 8px' }}>
            Staying safe — know the warning signs
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#78350f', margin: '0 0 16px', lineHeight: 1.65 }}>
            Seniors are targeted by scammers more than any other group. Here are the most common scams to watch for:
          </p>
          <ul style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#451a03', margin: '0 0 16px', paddingLeft: '20px', lineHeight: 2 }}>
            <li><strong>IRS / Medicare impersonation calls</strong> — the IRS and Medicare never call to demand immediate payment or personal information.</li>
            <li><strong>Tech support scams</strong> — no legitimate company calls you to say "your computer has a virus." Hang up immediately.</li>
            <li><strong>Gift card payment requests</strong> — any request to pay with gift cards is always a scam, no exceptions.</li>
            <li><strong>Lottery / sweepstakes fraud</strong> — you cannot win a prize you did not enter, and real lotteries never ask for fees to claim winnings.</li>
            <li><strong>Romance scams</strong> — someone online who quickly professes love and then asks for money is almost always a scammer.</li>
            <li><strong>Grandparent scam</strong> — a caller claiming to be a grandchild in trouble who needs money wired urgently. Always verify with a family member first.</li>
          </ul>
          <div style={{ backgroundColor: '#fef3c7', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#78350f', margin: 0, fontWeight: 500 }}>
              Think you may have been targeted? Contact your navigator immediately — we can help you assess the situation safely and connect you with the right resources.
            </p>
          </div>
        </section>

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
