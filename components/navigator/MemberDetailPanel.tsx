'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Member } from '@/lib/data/members'
import type { CheckInCall } from '@/lib/data/calls'
import type { FamilyMember, NavigatorNote } from '@/lib/data/navigator'
import type { ServiceBooking } from '@/lib/data/services'
import type { BookingStatus } from '@/types/database'
import type { Volunteer } from '@/lib/data/volunteers'

const SERVICE_LABELS: Record<string, string> = {
  transport: '🚗 Transport',
  home_service: '🏠 Home Services',
  meals: '🥗 Meals',
  telehealth: '🏥 Health Services',
  legal_financial: '⚖️ Legal & Financial',
  tech_help: '💻 Tech Help',
  companion: '🤝 Companionship',
  companionship: '🤝 Companionship & Social',
}

const DISPATCH_LABELS: Record<string, string> = {
  lyft: 'Lyft Healthcare',
  volunteer_driver: 'Volunteer driver',
  manual: 'Manual arrangement',
  volunteer_tech: 'Volunteer tech helper',
  inHome_visit: 'In-home visit',
  remote_call: 'Remote help call',
  meal_partner: 'Meal partner network',
  volunteer_meals: 'Volunteer meal helper',
  meal_arrangement: 'Manual arrangement',
  vetted_provider: 'Vetted provider',
  scheduled_visit: 'Scheduled visit',
}

function statusColor(s: string): { bg: string; text: string } {
  if (s === 'completed') return { bg: '#d1fae5', text: '#065F46' }
  if (s === 'cancelled') return { bg: '#f3f4f6', text: '#6b7280' }
  if (s === 'confirmed') return { bg: '#dbeafe', text: '#1d4ed8' }
  if (s === 'in_progress') return { bg: '#fef3c7', text: '#92400e' }
  return { bg: '#fff3e0', text: '#c2410c' }
}

interface PanelData {
  member: Member
  calls: CheckInCall[]
  family: FamilyMember[]
  notes: NavigatorNote[]
  brief: string
  navigatorId: string
  bookings: ServiceBooking[]
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

function calcAge(dob: string): string {
  try {
    const born = new Date(dob)
    const now = new Date()
    const age = now.getFullYear() - born.getFullYear() -
      (now < new Date(now.getFullYear(), born.getMonth(), born.getDate()) ? 1 : 0)
    return `${age} yrs`
  } catch {
    return '—'
  }
}

function moodLabel(score: number | null): string {
  if (score === null) return '—'
  if (score >= 8) return `😊 ${score}/10`
  if (score >= 6) return `🙂 ${score}/10`
  if (score >= 4) return `😐 ${score}/10`
  return `😔 ${score}/10`
}

interface Props {
  memberId: string
  memberName: string
  triggerRef: React.RefObject<HTMLElement | null>
  onClose: () => void
}

export function MemberDetailPanel({ memberId, memberName, triggerRef, onClose }: Props) {
  const [panelData, setPanelData] = useState<PanelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [localNotes, setLocalNotes] = useState<NavigatorNote[]>([])

  const [referralType, setReferralType] = useState('')
  const [referralNote, setReferralNote] = useState('')
  const [referralSaving, setReferralSaving] = useState(false)
  const [referralSaved, setReferralSaved] = useState(false)
  const [referralError, setReferralError] = useState<string | null>(null)

  // Service booking interactive state
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null)
  const [localBookings, setLocalBookings] = useState<ServiceBooking[]>([])
  const [bookingActionLoading, setBookingActionLoading] = useState<Record<string, boolean>>({})
  const [bookingActionError, setBookingActionError] = useState<Record<string, string>>({})
  const [bookingNoteText, setBookingNoteText] = useState<Record<string, string>>({})
  const [cancelReason, setCancelReason] = useState<Record<string, string>>({})
  const [showCancelInput, setShowCancelInput] = useState<Record<string, boolean>>({})
  const [activeDispatch, setActiveDispatch] = useState<Record<string, string | null>>({})
  const [dispatchFormData, setDispatchFormData] = useState<Record<string, {
    scheduledTime?: string
    providerName?: string
    providerCompany?: string
    providerPhone?: string
    arrangement?: string
    healthSubtype?: string
    platform?: string
    therapistName?: string
    therapistContact?: string
    followUpDate?: string
  }>>({})

  // Volunteer picker state — keyed by `${bookingId}_${dispatchType}`
  const [selectedVolunteer, setSelectedVolunteer] = useState<Record<string, Volunteer | null>>({})

  // Reassign / reschedule / cancel-with-reason mode for confirmed bookings
  const [reassignMode, setReassignMode] = useState<Record<string, string | null>>({}) // bookingId -> dispatchType
  const [rescheduleMode, setRescheduleMode] = useState<Record<string, boolean>>({})
  const [rescheduleTime, setRescheduleTime] = useState<Record<string, string>>({})
  const [cancelReasonSelect, setCancelReasonSelect] = useState<Record<string, string>>({})
  const [cancelReasonNote, setCancelReasonNote] = useState<Record<string, string>>({})
  const [showCancelReason, setShowCancelReason] = useState<Record<string, boolean>>({})

  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFetchError(null)
    fetch(`/api/navigator/members/${memberId}/detail`)
      .then(r => r.json())
      .then((json: PanelData & { error?: string }) => {
        if (cancelled) return
        if (json.error) {
          setFetchError(json.error)
        } else {
          setPanelData(json)
          setLocalNotes(json.notes ?? [])
          setLocalBookings(json.bookings ?? [])
        }
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError('Could not load member details.')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [memberId])

  // Focus the close button when panel opens
  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  // Trap focus inside panel
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      triggerRef.current?.focus()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [onClose, triggerRef])

  // Click outside to close
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
      triggerRef.current?.focus()
    }
  }, [onClose, triggerRef])

  const handleDispatch = async (
    bookingId: string,
    dispatchType: string,
    dispatchDetails: Record<string, string>,
    volunteerId?: string,
    action?: string
  ) => {
    setBookingActionLoading(prev => ({ ...prev, [bookingId]: true }))
    setBookingActionError(prev => { const n = { ...prev }; delete n[bookingId]; return n })
    try {
      const payload: Record<string, unknown> = {
        status: 'confirmed',
        dispatch_type: dispatchType,
        dispatch_details: dispatchDetails,
      }
      if (volunteerId) payload.volunteer_id = volunteerId
      if (action) payload.action = action

      const res = await fetch(`/api/services/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setBookingActionError(prev => ({ ...prev, [bookingId]: json.error ?? 'Dispatch failed.' }))
      } else {
        setLocalBookings(prev => prev.map(b => b.id === bookingId ? (json.booking as ServiceBooking) : b))
        setActiveDispatch(prev => ({ ...prev, [bookingId]: null }))
        setDispatchFormData(prev => ({ ...prev, [bookingId]: {} }))
        // Clear volunteer selections for this booking
        setSelectedVolunteer(prev => {
          const next = { ...prev }
          Object.keys(next).filter(k => k.startsWith(bookingId)).forEach(k => { delete next[k] })
          return next
        })
        setExpandedBookingId(null)
      }
    } catch {
      setBookingActionError(prev => ({ ...prev, [bookingId]: 'Network error. Please try again.' }))
    } finally {
      setBookingActionLoading(prev => { const n = { ...prev }; delete n[bookingId]; return n })
    }
  }

  const handleReschedule = async (bookingId: string, newTime: string) => {
    setBookingActionLoading(prev => ({ ...prev, [bookingId]: true }))
    setBookingActionError(prev => { const n = { ...prev }; delete n[bookingId]; return n })
    try {
      const res = await fetch(`/api/services/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed', action: 'reschedule', scheduled_time: newTime }),
      })
      const json = await res.json()
      if (!res.ok) {
        setBookingActionError(prev => ({ ...prev, [bookingId]: json.error ?? 'Reschedule failed.' }))
      } else {
        setLocalBookings(prev => prev.map(b => b.id === bookingId ? (json.booking as ServiceBooking) : b))
        setRescheduleMode(prev => ({ ...prev, [bookingId]: false }))
        setRescheduleTime(prev => ({ ...prev, [bookingId]: '' }))
      }
    } catch {
      setBookingActionError(prev => ({ ...prev, [bookingId]: 'Network error. Please try again.' }))
    } finally {
      setBookingActionLoading(prev => { const n = { ...prev }; delete n[bookingId]; return n })
    }
  }

  const handleCancelWithReason = async (bookingId: string) => {
    const reason = cancelReasonSelect[bookingId] ?? ''
    if (!reason) return
    setBookingActionLoading(prev => ({ ...prev, [bookingId]: true }))
    setBookingActionError(prev => { const n = { ...prev }; delete n[bookingId]; return n })
    try {
      const note = cancelReasonNote[bookingId] ?? ''
      const fullNote = note.trim() ? `${reason}. ${note.trim()}` : reason
      const res = await fetch(`/api/services/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', cancel_reason: fullNote }),
      })
      const json = await res.json()
      if (!res.ok) {
        setBookingActionError(prev => ({ ...prev, [bookingId]: json.error ?? 'Cancellation failed.' }))
      } else {
        setLocalBookings(prev => prev.map(b => b.id === bookingId ? (json.booking as ServiceBooking) : b))
        setShowCancelReason(prev => ({ ...prev, [bookingId]: false }))
      }
    } catch {
      setBookingActionError(prev => ({ ...prev, [bookingId]: 'Network error. Please try again.' }))
    } finally {
      setBookingActionLoading(prev => { const n = { ...prev }; delete n[bookingId]; return n })
    }
  }

  const handleSaveNote = async () => {
    if (!noteText.trim() || !panelData) return
    setNoteSaving(true)
    setNoteError(null)
    try {
      const res = await fetch('/api/navigator/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, note: noteText.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setNoteError(json.error ?? 'Failed to save note.')
      } else {
        setLocalNotes(prev => [json.note as NavigatorNote, ...prev])
        setNoteText('')
      }
    } catch {
      setNoteError('Network error. Please try again.')
    } finally {
      setNoteSaving(false)
    }
  }

  const handleSaveReferral = async () => {
    if (!referralType || !referralNote.trim() || !panelData) return
    setReferralSaving(true)
    setReferralError(null)
    try {
      const res = await fetch('/api/navigator/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, referral_type: referralType, referral_note: referralNote.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setReferralError(json.error ?? 'Failed to record referral.')
      } else {
        setLocalNotes(prev => [json.note as NavigatorNote, ...prev])
        setReferralSaved(true)
        setReferralType('')
        setReferralNote('')
      }
    } catch {
      setReferralError('Network error. Please try again.')
    } finally {
      setReferralSaving(false)
    }
  }

  const handleBookingAction = async (
    bookingId: string,
    status: BookingStatus,
    opts?: { navigator_note?: string; cancel_reason?: string }
  ) => {
    setBookingActionLoading(prev => ({ ...prev, [bookingId]: true }))
    setBookingActionError(prev => { const n = { ...prev }; delete n[bookingId]; return n })
    try {
      const res = await fetch(`/api/services/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...opts }),
      })
      const json = await res.json()
      if (!res.ok) {
        setBookingActionError(prev => ({ ...prev, [bookingId]: json.error ?? 'Action failed.' }))
      } else {
        setLocalBookings(prev => prev.map(b => b.id === bookingId ? (json.booking as ServiceBooking) : b))
        if (status === 'cancelled') setShowCancelInput(prev => ({ ...prev, [bookingId]: false }))
        if (opts?.navigator_note) setBookingNoteText(prev => ({ ...prev, [bookingId]: '' }))
        if (status !== 'cancelled') setExpandedBookingId(null)
      }
    } catch {
      setBookingActionError(prev => ({ ...prev, [bookingId]: 'Network error. Please try again.' }))
    } finally {
      setBookingActionLoading(prev => { const n = { ...prev }; delete n[bookingId]; return n })
    }
  }

  return (
    // Backdrop
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(15, 32, 68, 0.4)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      aria-label="Close member detail panel"
    >
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Member detail: ${memberName}`}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100%',
          backgroundColor: 'var(--color-warm-white)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(15,32,68,0.12)',
        }}
      >
        {/* Panel header */}
        <div
          style={{
            backgroundColor: 'var(--color-navy)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(250,250,245,0.6)', margin: 0, marginBottom: '2px' }}>
              Member detail
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-cream)', margin: 0 }}>
              {memberName}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={() => { onClose(); triggerRef.current?.focus() }}
            aria-label="Close panel"
            style={{
              background: 'transparent',
              border: '1px solid rgba(250,250,245,0.3)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-cream)',
              fontFamily: 'var(--font-body)',
              fontSize: '20px',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Panel body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px', flex: 1 }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '48px 0', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
              Loading…
            </div>
          )}

          {fetchError && (
            <div style={{ backgroundColor: 'var(--color-concern-bg)', border: '1px solid var(--color-concern-border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-concern-text)' }}>
              {fetchError}
            </div>
          )}

          {panelData && (
            <>
              {/* Profile */}
              <Section title="Profile">
                <InfoRow label="Full name" value={panelData.member.full_name} />
                <InfoRow label="Preferred name" value={panelData.member.preferred_name} />
                <InfoRow label="Date of birth" value={`${formatDate(panelData.member.date_of_birth)} (${calcAge(panelData.member.date_of_birth)})`} />
                <InfoRow label="Phone" value={panelData.member.phone_number} />
                <InfoRow label="Language" value={panelData.member.preferred_language} />
                <InfoRow label="Lives alone" value={panelData.member.lives_alone === null ? '—' : panelData.member.lives_alone ? 'Yes' : 'No'} />
                {panelData.member.health_conditions && (
                  <InfoRow label="Health conditions" value={panelData.member.health_conditions} />
                )}
                {panelData.member.medications && (
                  <InfoRow label="Medications" value={panelData.member.medications} />
                )}
              </Section>

              {/* Emergency contacts */}
              {(panelData.member.emergency_contact_1_name || panelData.member.emergency_contact_2_name) && (
                <Section title="Emergency contacts">
                  {panelData.member.emergency_contact_1_name && (
                    <ContactCard
                      name={panelData.member.emergency_contact_1_name}
                      phone={panelData.member.emergency_contact_1_phone}
                      rel={panelData.member.emergency_contact_1_rel}
                    />
                  )}
                  {panelData.member.emergency_contact_2_name && (
                    <ContactCard
                      name={panelData.member.emergency_contact_2_name}
                      phone={panelData.member.emergency_contact_2_phone}
                      rel={panelData.member.emergency_contact_2_rel}
                    />
                  )}
                </Section>
              )}

              {/* Family contacts */}
              {panelData.family.length > 0 && (
                <Section title="Family contacts">
                  {panelData.family.map(fm => (
                    <div
                      key={fm.id}
                      style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '8px' }}
                    >
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>
                        {fm.full_name}
                        {fm.relationship && (
                          <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: '8px', fontSize: '13px' }}>
                            ({fm.relationship})
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {fm.phone && <span>{fm.phone}</span>}
                        <span>{fm.email}</span>
                        {fm.last_login_at && <span>Last active: {formatDate(fm.last_login_at)}</span>}
                      </div>
                    </div>
                  ))}
                </Section>
              )}

              {/* Navigator brief */}
              <Section title="Pre-call brief">
                <div
                  style={{
                    backgroundColor: 'var(--color-teal-muted)',
                    border: '1px solid rgba(26,122,106,0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: '16px',
                    color: 'var(--color-navy)',
                    lineHeight: 1.6,
                  }}
                >
                  {panelData.brief}
                </div>
              </Section>

              {/* Recent calls */}
              <Section title={`Recent calls (${panelData.calls.length})`}>
                {panelData.calls.length === 0 ? (
                  <EmptyState text="No calls on record." />
                ) : (
                  panelData.calls.map(call => (
                    <div
                      key={call.id}
                      style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '8px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: call.ai_summary ? '8px' : 0, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {formatDate(call.ended_at ?? call.created_at)}
                        </span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {moodLabel(call.mood_score)}
                        </span>
                        {call.medication_taken !== null && (
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: call.medication_taken ? 'var(--color-teal)' : 'var(--color-concern-text)' }}>
                            Meds: {call.medication_taken ? 'Taken' : 'Missed'}
                          </span>
                        )}
                      </div>
                      {call.ai_summary && (
                        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '14px', color: 'var(--color-navy)', margin: 0, lineHeight: 1.5 }}>
                          {call.ai_summary}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </Section>

              {/* Navigator notes */}
              <Section title="Navigator notes">
                <div style={{ marginBottom: '12px' }}>
                  <label
                    htmlFor="navigator-note"
                    style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '6px' }}
                  >
                    Add a note
                  </label>
                  <textarea
                    id="navigator-note"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Type a note about this member…"
                    rows={3}
                    style={{
                      width: '100%',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      color: 'var(--color-text-primary)',
                      backgroundColor: 'white',
                      border: '1.5px solid var(--color-warm-grey)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {noteError && (
                    <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-emergency-text)', margin: '4px 0 0' }}>
                      {noteError}
                    </p>
                  )}
                  <button
                    onClick={handleSaveNote}
                    disabled={noteSaving || !noteText.trim()}
                    style={{
                      marginTop: '8px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'white',
                      backgroundColor: noteSaving || !noteText.trim() ? 'var(--color-warm-grey)' : 'var(--color-teal)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 20px',
                      cursor: noteSaving || !noteText.trim() ? 'not-allowed' : 'pointer',
                      minHeight: '40px',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {noteSaving ? 'Saving…' : 'Save note'}
                  </button>
                </div>

                {localNotes.length === 0 ? (
                  <EmptyState text="No notes yet." />
                ) : (
                  localNotes.map(n => (
                    <div
                      key={n.id}
                      style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '8px' }}
                    >
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-primary)', margin: '0 0 6px', lineHeight: 1.5 }}>
                        {n.note}
                      </p>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                  ))
                )}
              </Section>

              {/* External support referral */}
              <Section title="Refer to external support">
                {referralSaved && (
                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '12px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#065F46', fontWeight: 500 }}>
                    ✓ Referral recorded and logged to member notes.
                  </div>
                )}
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                  Record a warm referral to an external professional. This will be saved to the member&apos;s notes.
                  Always provide a personal introduction — never just a phone number.
                </p>
                <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="referral-type" style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '5px' }}>
                    Referral type
                  </label>
                  <select
                    id="referral-type"
                    value={referralType}
                    onChange={e => setReferralType(e.target.value)}
                    style={{
                      width: '100%',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      color: referralType ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      backgroundColor: 'white',
                      border: '1.5px solid var(--color-warm-grey)',
                      borderRadius: 'var(--radius-md)',
                      padding: '9px 12px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">Select a referral type…</option>
                    <option>Grief / bereavement counselor</option>
                    <option>Mental health professional (therapist)</option>
                    <option>Elder law attorney</option>
                    <option>Financial advisor / planner</option>
                    <option>Hospice / palliative care</option>
                    <option>Social worker</option>
                    <option>Psychiatric medication support</option>
                    <option>Other professional support</option>
                  </select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="referral-note" style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '5px' }}>
                    Referral note (what you told the member, and why)
                  </label>
                  <textarea
                    id="referral-note"
                    value={referralNote}
                    onChange={e => setReferralNote(e.target.value)}
                    placeholder="e.g. Member expressed interest in speaking with a grief counselor after loss of spouse. Mentioned she prefers someone who speaks Spanish. Will warm-introduce to Dr. Santos."
                    rows={3}
                    style={{
                      width: '100%',
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      color: 'var(--color-text-primary)',
                      backgroundColor: 'white',
                      border: '1.5px solid var(--color-warm-grey)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {referralError && (
                  <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-emergency-text)', margin: '0 0 8px' }}>
                    {referralError}
                  </p>
                )}
                <button
                  onClick={handleSaveReferral}
                  disabled={referralSaving || !referralType || !referralNote.trim()}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'white',
                    backgroundColor: referralSaving || !referralType || !referralNote.trim() ? 'var(--color-warm-grey)' : '#7C3AED',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '9px 20px',
                    cursor: referralSaving || !referralType || !referralNote.trim() ? 'not-allowed' : 'pointer',
                    minHeight: '38px',
                    transition: 'background-color 0.15s',
                  }}
                >
                  {referralSaving ? 'Saving…' : '↗ Record referral'}
                </button>
              </Section>

              {/* Service Bookings — interactive */}
              <Section title="Service bookings">
                {localBookings.length === 0 ? (
                  <EmptyState text="No service bookings for this member." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {localBookings.slice(0, 8).map((b) => {
                      const isExpanded = expandedBookingId === b.id
                      const sc = statusColor(b.status)
                      const details = b.booking_details as Record<string, string>
                      const isLoading = !!bookingActionLoading[b.id]
                      const isActive = b.status !== 'completed' && b.status !== 'cancelled'
                      return (
                        <div
                          key={b.id}
                          style={{
                            backgroundColor: 'white',
                            border: isExpanded ? '2px solid var(--color-teal)' : '1px solid var(--color-warm-grey)',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            transition: 'border 0.15s',
                          }}
                        >
                          {/* Clickable header row */}
                          <button
                            type="button"
                            onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '10px 14px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                            aria-expanded={isExpanded}
                          >
                            <div>
                              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', margin: 0 }}>
                                {SERVICE_LABELS[b.service_type] ?? b.service_type}
                              </p>
                              {b.requested_for && (
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                                  {new Date(b.requested_for).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                </p>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, color: sc.text, backgroundColor: sc.bg, borderRadius: '20px', padding: '2px 8px' }}>
                                {b.status.charAt(0).toUpperCase() + b.status.slice(1).replace('_', ' ')}
                              </span>
                              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            </div>
                          </button>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div style={{ borderTop: '1px solid var(--color-warm-grey)', padding: '14px', backgroundColor: '#fafaf8' }}>
                              {/* Booking details */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                                <DetailItem label="Service" value={SERVICE_LABELS[b.service_type] ?? b.service_type} />
                                {b.requested_for && (
                                  <DetailItem label="Requested for" value={new Date(b.requested_for).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })} />
                                )}
                                {details.pickup_address && <DetailItem label="Pickup" value={details.pickup_address} />}
                                {details.destination && <DetailItem label="Destination" value={details.destination} />}
                                {details.description && <DetailItem label="Description" value={details.description} />}
                                {details.dispatch_type && <DetailItem label="Dispatch method" value={DISPATCH_LABELS[details.dispatch_type] ?? details.dispatch_type} />}
                                {details.assigned_volunteer && <DetailItem label="Assigned volunteer" value={details.assigned_volunteer} />}
                                {details.assigned_provider && <DetailItem label="Assigned provider" value={details.assigned_provider} />}
                                {details.scheduled_time && <DetailItem label="Scheduled for" value={new Date(details.scheduled_time).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })} />}
                                {details.arrangement && <DetailItem label="Arrangement" value={details.arrangement} />}
                                {details.provider && !details.dispatch_type?.includes('volunteer') && <DetailItem label="Provider" value={details.provider} />}
                              </div>
                              {b.notes && (
                                <div style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', marginBottom: '12px', fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginRight: '4px' }}>Notes:</span>{b.notes}
                                </div>
                              )}

                              {bookingActionError[b.id] && (
                                <p style={{ fontSize: '13px', color: 'var(--color-emergency-text)', fontFamily: 'var(--font-body)', margin: '0 0 8px' }}>
                                  {bookingActionError[b.id]}
                                </p>
                              )}

                              {/* Action buttons — only for active bookings */}
                              {isActive && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                                  {/* REQUESTED: standard progression buttons */}
                                  {b.status === 'requested' && (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                      <ActionBtn label={isLoading ? 'Saving…' : 'Mark confirmed'} onClick={() => handleBookingAction(b.id, 'confirmed')} disabled={isLoading} color="#1d4ed8" bg="#dbeafe" />
                                      <ActionBtn label={isLoading ? 'Saving…' : 'Mark completed'} onClick={() => handleBookingAction(b.id, 'completed')} disabled={isLoading} color="#065F46" bg="#d1fae5" />
                                      <ActionBtn label="Cancel" onClick={() => setShowCancelInput(prev => ({ ...prev, [b.id]: !prev[b.id] }))} disabled={isLoading} color="#9f1239" bg="#ffe4e6" />
                                    </div>
                                  )}

                                  {/* CONFIRMED / IN_PROGRESS: reassign, reschedule, cancel with reason */}
                                  {(b.status === 'confirmed' || b.status === 'in_progress') && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <ActionBtn label={isLoading ? 'Saving…' : 'Mark completed'} onClick={() => handleBookingAction(b.id, 'completed')} disabled={isLoading} color="#065F46" bg="#d1fae5" />
                                        <ActionBtn label={isLoading ? '…' : '↺ Reassign'} onClick={() => setReassignMode(prev => ({ ...prev, [b.id]: prev[b.id] ? null : b.service_type }))} disabled={isLoading} color="#1d4ed8" bg="#dbeafe" />
                                        <ActionBtn label={isLoading ? '…' : '📅 Reschedule'} onClick={() => setRescheduleMode(prev => ({ ...prev, [b.id]: !prev[b.id] }))} disabled={isLoading} color="#6b21a8" bg="#f5f3ff" />
                                        <ActionBtn label="✕ Cancel" onClick={() => setShowCancelReason(prev => ({ ...prev, [b.id]: !prev[b.id] }))} disabled={isLoading} color="#9f1239" bg="#ffe4e6" />
                                      </div>

                                      {/* Reschedule panel */}
                                      {rescheduleMode[b.id] && (
                                        <div style={{ backgroundColor: '#faf5ff', border: '1px solid #d8b4fe', borderRadius: 'var(--radius-sm)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                          <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#6b21a8' }}>New date &amp; time</label>
                                          <input type="datetime-local" value={rescheduleTime[b.id] ?? ''} onChange={e => setRescheduleTime(prev => ({ ...prev, [b.id]: e.target.value }))} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #d8b4fe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' }} />
                                          <ActionBtn label={isLoading ? 'Saving…' : 'Confirm reschedule'} onClick={() => handleReschedule(b.id, rescheduleTime[b.id] ?? '')} disabled={isLoading || !rescheduleTime[b.id]} color="white" bg="#7c3aed" />
                                        </div>
                                      )}

                                      {/* Cancel with reason panel */}
                                      {showCancelReason[b.id] && (
                                        <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                          <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#9f1239' }}>Reason for cancellation</label>
                                          <select value={cancelReasonSelect[b.id] ?? ''} onChange={e => setCancelReasonSelect(prev => ({ ...prev, [b.id]: e.target.value }))} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' }}>
                                            <option value="">Select a reason…</option>
                                            <option>Volunteer unavailable</option>
                                            <option>Member request</option>
                                            <option>Scheduling conflict</option>
                                            <option>Service no longer needed</option>
                                            <option>Other</option>
                                          </select>
                                          <input type="text" value={cancelReasonNote[b.id] ?? ''} onChange={e => setCancelReasonNote(prev => ({ ...prev, [b.id]: e.target.value }))} placeholder="Additional notes (optional)…" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' }} />
                                          <ActionBtn label={isLoading ? 'Cancelling…' : 'Confirm cancellation'} onClick={() => handleCancelWithReason(b.id)} disabled={isLoading || !cancelReasonSelect[b.id]} color="white" bg="#be123c" />
                                        </div>
                                      )}

                                      {/* Reassign dispatch panel — same as dispatch options but sends action='reassign' */}
                                      {reassignMode[b.id] && (
                                        <ReassignPanel
                                          bookingId={b.id}
                                          serviceType={b.service_type}
                                          isLoading={isLoading}
                                          dispatchFormData={dispatchFormData}
                                          setDispatchFormData={setDispatchFormData}
                                          selectedVolunteer={selectedVolunteer}
                                          setSelectedVolunteer={setSelectedVolunteer}
                                          onReassign={(dispatchType, dispatchDetails, volunteerId) => {
                                            setReassignMode(prev => ({ ...prev, [b.id]: null }))
                                            handleDispatch(b.id, dispatchType, { ...dispatchDetails }, volunteerId, 'reassign')
                                          }}
                                        />
                                      )}
                                    </div>
                                  )}

                                  {/* Simple cancel for requested (existing flow) */}
                                  {b.status === 'requested' && showCancelInput[b.id] && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                      <input type="text" value={cancelReason[b.id] ?? ''} onChange={e => setCancelReason(prev => ({ ...prev, [b.id]: e.target.value }))} placeholder="Reason for cancellation…" style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '7px 10px', outline: 'none', backgroundColor: 'white' }} />
                                      <ActionBtn label="Confirm cancel" onClick={() => handleBookingAction(b.id, 'cancelled', { cancel_reason: cancelReason[b.id] })} disabled={isLoading} color="#9f1239" bg="#ffe4e6" />
                                    </div>
                                  )}

                                  {/* Add navigator note to booking */}
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginTop: '4px' }}>
                                    <input type="text" value={bookingNoteText[b.id] ?? ''} onChange={e => setBookingNoteText(prev => ({ ...prev, [b.id]: e.target.value }))} placeholder="Add navigator note to booking…" style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', outline: 'none', backgroundColor: 'white' }} />
                                    <ActionBtn label="Save note" onClick={() => handleBookingAction(b.id, b.status as BookingStatus, { navigator_note: bookingNoteText[b.id] })} disabled={isLoading || !bookingNoteText[b.id]?.trim()} color="#374151" bg="#f3f4f6" />
                                  </div>
                                </div>
                              )}

                              {/* Service-type-specific dispatch — shown only for requested bookings */}
                              {isActive && b.status === 'requested' && (
                                <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '12px', paddingTop: '12px' }}>
                                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b7280', margin: '0 0 8px' }}>
                                    Dispatch options
                                  </p>

                                  {/* TRANSPORT */}
                                  {b.service_type === 'transport' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <DispatchBtn icon="🚗" label="Dispatch via Lyft Healthcare" isActive={activeDispatch[b.id] === 'lyft'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'lyft' ? null : 'lyft' }))} />
                                      {activeDispatch[b.id] === 'lyft' && (
                                        <DispatchForm bg="#eff6ff" border="#bfdbfe">
                                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#1e40af', margin: '0 0 8px', lineHeight: 1.4 }}>
                                            Dispatches a Lyft Healthcare vehicle to the pickup address above.
                                          </p>
                                          <ActionBtn label={isLoading ? 'Dispatching…' : 'Confirm Lyft dispatch'} onClick={() => handleDispatch(b.id, 'lyft', { provider: 'Lyft Healthcare' })} disabled={isLoading} color="white" bg="#1d4ed8" />
                                        </DispatchForm>
                                      )}
                                      <DispatchBtn icon="🙋" label="Assign volunteer driver" isActive={activeDispatch[b.id] === 'volunteer_driver'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'volunteer_driver' ? null : 'volunteer_driver' }))} />
                                      {activeDispatch[b.id] === 'volunteer_driver' && (() => {
                                        const vkey = `${b.id}_volunteer_driver`
                                        const picked = selectedVolunteer[vkey] ?? null
                                        return (
                                          <DispatchForm bg="#f0fdf4" border="#86efac">
                                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#065f46', margin: '0 0 6px' }}>Select a volunteer driver:</p>
                                            <VolunteerPicker visitType="walking_companion" selectedId={picked?.id} onSelect={vol => setSelectedVolunteer(prev => ({ ...prev, [vkey]: vol }))} />
                                            {picked && <VolunteerConfirmCard volunteer={picked} />}
                                            <ActionBtn label={isLoading ? 'Assigning…' : 'Assign driver'} onClick={() => handleDispatch(b.id, 'volunteer_driver', { assigned_volunteer: picked?.full_name ?? '' }, picked?.id)} disabled={isLoading || !picked} color="white" bg="#059669" />
                                          </DispatchForm>
                                        )
                                      })()}
                                      <DispatchBtn icon="✓" label="Confirm manual arrangement" isActive={activeDispatch[b.id] === 'manual'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'manual' ? null : 'manual' }))} />
                                      {activeDispatch[b.id] === 'manual' && (
                                        <DispatchForm bg="#f9fafb" border="#e5e7eb">
                                          <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>How was this arranged?</label>
                                          <input type="text" value={dispatchFormData[b.id]?.arrangement ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], arrangement: e.target.value } }))} placeholder="e.g. Son will drive, confirmed by phone" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }} />
                                          <ActionBtn label={isLoading ? 'Confirming…' : 'Confirm arrangement'} onClick={() => handleDispatch(b.id, 'manual', { arrangement: dispatchFormData[b.id]?.arrangement ?? '' })} disabled={isLoading || !dispatchFormData[b.id]?.arrangement?.trim()} color="white" bg="#374151" />
                                        </DispatchForm>
                                      )}
                                    </div>
                                  )}

                                  {/* TECH HELP */}
                                  {b.service_type === 'tech_help' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <DispatchBtn icon="🙋" label="Assign volunteer tech helper" isActive={activeDispatch[b.id] === 'volunteer_tech'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'volunteer_tech' ? null : 'volunteer_tech' }))} />
                                      {activeDispatch[b.id] === 'volunteer_tech' && (() => {
                                        const vkey = `${b.id}_volunteer_tech`
                                        const picked = selectedVolunteer[vkey] ?? null
                                        return (
                                          <DispatchForm bg="#f0fdf4" border="#86efac">
                                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#065f46', margin: '0 0 6px' }}>Select a tech volunteer:</p>
                                            <VolunteerPicker visitType="tech_help" selectedId={picked?.id} onSelect={vol => setSelectedVolunteer(prev => ({ ...prev, [vkey]: vol }))} />
                                            {picked && <VolunteerConfirmCard volunteer={picked} />}
                                            <ActionBtn label={isLoading ? 'Assigning…' : 'Assign tech helper'} onClick={() => handleDispatch(b.id, 'volunteer_tech', { assigned_volunteer: picked?.full_name ?? '' }, picked?.id)} disabled={isLoading || !picked} color="white" bg="#059669" />
                                          </DispatchForm>
                                        )
                                      })()}
                                      <DispatchBtn icon="🏠" label="Schedule in-home visit" isActive={activeDispatch[b.id] === 'inHome_visit'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'inHome_visit' ? null : 'inHome_visit' }))} />
                                      {activeDispatch[b.id] === 'inHome_visit' && (() => {
                                        const vkey = `${b.id}_inHome_visit`
                                        const picked = selectedVolunteer[vkey] ?? null
                                        return (
                                          <DispatchForm bg="#eff6ff" border="#bfdbfe">
                                            <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#1e40af', display: 'block', marginBottom: '3px' }}>Visit date &amp; time</label>
                                            <input type="datetime-local" value={dispatchFormData[b.id]?.scheduledTime ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], scheduledTime: e.target.value } }))} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #bfdbfe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '10px' }} />
                                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#1e40af', margin: '0 0 6px' }}>Assign a tech volunteer:</p>
                                            <VolunteerPicker visitType="tech_help" selectedId={picked?.id} onSelect={vol => setSelectedVolunteer(prev => ({ ...prev, [vkey]: vol }))} />
                                            {picked && <VolunteerConfirmCard volunteer={picked} />}
                                            <ActionBtn label={isLoading ? 'Scheduling…' : 'Schedule visit'} onClick={() => handleDispatch(b.id, 'inHome_visit', { assigned_volunteer: picked?.full_name ?? '', scheduled_time: dispatchFormData[b.id]?.scheduledTime ?? '' }, picked?.id)} disabled={isLoading || !picked || !dispatchFormData[b.id]?.scheduledTime} color="white" bg="#1d4ed8" />
                                          </DispatchForm>
                                        )
                                      })()}
                                      <DispatchBtn icon="📞" label="Arrange remote help call" isActive={activeDispatch[b.id] === 'remote_call'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'remote_call' ? null : 'remote_call' }))} />
                                      {activeDispatch[b.id] === 'remote_call' && (
                                        <DispatchForm bg="#faf5ff" border="#d8b4fe">
                                          <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#6b21a8', display: 'block', marginBottom: '3px' }}>Scheduled call date &amp; time</label>
                                          <input type="datetime-local" value={dispatchFormData[b.id]?.scheduledTime ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], scheduledTime: e.target.value } }))} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #d8b4fe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }} />
                                          <ActionBtn label={isLoading ? 'Scheduling…' : 'Schedule call'} onClick={() => handleDispatch(b.id, 'remote_call', { scheduled_time: dispatchFormData[b.id]?.scheduledTime ?? '' })} disabled={isLoading || !dispatchFormData[b.id]?.scheduledTime} color="white" bg="#7c3aed" />
                                        </DispatchForm>
                                      )}
                                    </div>
                                  )}

                                  {/* MEALS */}
                                  {b.service_type === 'meals' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <DispatchBtn icon="🥘" label="Order via meal partner" isActive={activeDispatch[b.id] === 'meal_partner'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'meal_partner' ? null : 'meal_partner' }))} />
                                      {activeDispatch[b.id] === 'meal_partner' && (
                                        <DispatchForm bg="#fffbeb" border="#fde68a">
                                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#92400e', margin: '0 0 8px', lineHeight: 1.4 }}>
                                            Confirms a meal delivery order via our partner network.
                                          </p>
                                          <ActionBtn label={isLoading ? 'Ordering…' : 'Confirm meal order'} onClick={() => handleDispatch(b.id, 'meal_partner', { provider: 'Meal partner network' })} disabled={isLoading} color="white" bg="#d97706" />
                                        </DispatchForm>
                                      )}
                                      <DispatchBtn icon="🙋" label="Assign volunteer meal helper" isActive={activeDispatch[b.id] === 'volunteer_meals'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'volunteer_meals' ? null : 'volunteer_meals' }))} />
                                      {activeDispatch[b.id] === 'volunteer_meals' && (() => {
                                        const vkey = `${b.id}_volunteer_meals`
                                        const picked = selectedVolunteer[vkey] ?? null
                                        return (
                                          <DispatchForm bg="#f0fdf4" border="#86efac">
                                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#065f46', margin: '0 0 6px' }}>Select a meal volunteer:</p>
                                            <VolunteerPicker visitType="grocery_help" selectedId={picked?.id} onSelect={vol => setSelectedVolunteer(prev => ({ ...prev, [vkey]: vol }))} />
                                            {picked && <VolunteerConfirmCard volunteer={picked} />}
                                            <ActionBtn label={isLoading ? 'Assigning…' : 'Assign volunteer'} onClick={() => handleDispatch(b.id, 'volunteer_meals', { assigned_volunteer: picked?.full_name ?? '' }, picked?.id)} disabled={isLoading || !picked} color="white" bg="#059669" />
                                          </DispatchForm>
                                        )
                                      })()}
                                      <DispatchBtn icon="✓" label="Confirm arrangement" isActive={activeDispatch[b.id] === 'meal_arrangement'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'meal_arrangement' ? null : 'meal_arrangement' }))} />
                                      {activeDispatch[b.id] === 'meal_arrangement' && (
                                        <DispatchForm bg="#f9fafb" border="#e5e7eb">
                                          <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>Arrangement details</label>
                                          <input type="text" value={dispatchFormData[b.id]?.arrangement ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], arrangement: e.target.value } }))} placeholder="e.g. Daughter brings meals Mon/Wed" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }} />
                                          <ActionBtn label={isLoading ? 'Confirming…' : 'Confirm arrangement'} onClick={() => handleDispatch(b.id, 'meal_arrangement', { arrangement: dispatchFormData[b.id]?.arrangement ?? '' })} disabled={isLoading || !dispatchFormData[b.id]?.arrangement?.trim()} color="white" bg="#374151" />
                                        </DispatchForm>
                                      )}
                                    </div>
                                  )}

                                  {/* HOME SERVICES */}
                                  {b.service_type === 'home_service' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <DispatchBtn icon="🙋" label="Assign from platform volunteers" isActive={activeDispatch[b.id] === 'home_volunteer'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'home_volunteer' ? null : 'home_volunteer' }))} />
                                      {activeDispatch[b.id] === 'home_volunteer' && (() => {
                                        const vkey = `${b.id}_home_volunteer`
                                        const picked = selectedVolunteer[vkey] ?? null
                                        return (
                                          <DispatchForm bg="#f0fdf4" border="#86efac">
                                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#065f46', margin: '0 0 6px' }}>Select a home services volunteer:</p>
                                            <VolunteerPicker visitType="in_person_visit" selectedId={picked?.id} onSelect={vol => setSelectedVolunteer(prev => ({ ...prev, [vkey]: vol }))} />
                                            {picked && <VolunteerConfirmCard volunteer={picked} />}
                                            <ActionBtn label={isLoading ? 'Assigning…' : 'Assign volunteer'} onClick={() => handleDispatch(b.id, 'home_volunteer', { assigned_volunteer: picked?.full_name ?? '' }, picked?.id)} disabled={isLoading || !picked} color="white" bg="#059669" />
                                          </DispatchForm>
                                        )
                                      })()}

                                      <DispatchBtn icon="🏢" label="Select from vetted providers" isActive={activeDispatch[b.id] === 'vetted_provider'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'vetted_provider' ? null : 'vetted_provider' }))} />
                                      {activeDispatch[b.id] === 'vetted_provider' && (
                                        <DispatchForm bg="#eff6ff" border="#bfdbfe">
                                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#1e40af', margin: '0 0 6px' }}>Select a vetted provider:</p>
                                          <ServiceProviderPicker serviceType="home_service" selectedProviderName={dispatchFormData[b.id]?.providerName} onSelect={(name) => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], providerName: name } }))} />
                                          <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#1e40af', display: 'block', marginTop: '6px', marginBottom: '3px' }}>Visit date &amp; time (optional)</label>
                                          <input type="datetime-local" value={dispatchFormData[b.id]?.scheduledTime ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], scheduledTime: e.target.value } }))} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #bfdbfe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }} />
                                          <ActionBtn label={isLoading ? 'Assigning…' : 'Assign provider'} onClick={() => handleDispatch(b.id, 'vetted_provider', { assigned_provider: dispatchFormData[b.id]?.providerName ?? '', scheduled_time: dispatchFormData[b.id]?.scheduledTime ?? '' })} disabled={isLoading || !dispatchFormData[b.id]?.providerName?.trim()} color="white" bg="#1d4ed8" />
                                        </DispatchForm>
                                      )}

                                      <DispatchBtn icon="✏️" label="Add external provider (manual)" isActive={activeDispatch[b.id] === 'external_provider'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'external_provider' ? null : 'external_provider' }))} />
                                      {activeDispatch[b.id] === 'external_provider' && (
                                        <DispatchForm bg="#fafaf8" border="#e5e7eb">
                                          <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>Provider name &amp; company</label>
                                          <input type="text" value={dispatchFormData[b.id]?.providerName ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], providerName: e.target.value } }))} placeholder="Provider name" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '4px' }} />
                                          <input type="text" value={dispatchFormData[b.id]?.providerCompany ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], providerCompany: e.target.value } }))} placeholder="Company/agency name (optional)" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '4px' }} />
                                          <input type="tel" value={dispatchFormData[b.id]?.providerPhone ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], providerPhone: e.target.value } }))} placeholder="Phone number (optional)" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '6px' }} />
                                          <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>Visit date &amp; time</label>
                                          <input type="datetime-local" value={dispatchFormData[b.id]?.scheduledTime ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], scheduledTime: e.target.value } }))} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }} />
                                          <ActionBtn label={isLoading ? 'Saving…' : 'Assign external provider'} onClick={() => handleDispatch(b.id, 'external_provider', { assigned_provider: [dispatchFormData[b.id]?.providerName, dispatchFormData[b.id]?.providerCompany].filter(Boolean).join(' — '), provider_phone: dispatchFormData[b.id]?.providerPhone ?? '', scheduled_time: dispatchFormData[b.id]?.scheduledTime ?? '' })} disabled={isLoading || !dispatchFormData[b.id]?.providerName?.trim()} color="white" bg="#374151" />
                                        </DispatchForm>
                                      )}

                                      <DispatchBtn icon="🔗" label="Request from partner network" isActive={activeDispatch[b.id] === 'partner_network'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'partner_network' ? null : 'partner_network' }))} />
                                      {activeDispatch[b.id] === 'partner_network' && (
                                        <DispatchForm bg="#fef9c3" border="#fde68a">
                                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#92400e', margin: '0 0 6px', lineHeight: 1.4 }}>
                                            Search partner home services network, then record the provider assigned.
                                          </p>
                                          <ActionBtn label="Search partner network (stub)" onClick={() => { console.log(`[STUB][HomeServices] Would search partner network for home_service near member ${b.member_id}`); setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], arrangement: 'Partner network search completed — assign provider below' } })) }} disabled={isLoading} color="white" bg="#d97706" />
                                          <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#92400e', display: 'block', marginTop: '8px', marginBottom: '3px' }}>Provider found / assigned</label>
                                          <input type="text" value={dispatchFormData[b.id]?.providerName ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], providerName: e.target.value } }))} placeholder="Provider or company name" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #fde68a', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '4px' }} />
                                          <input type="tel" value={dispatchFormData[b.id]?.providerPhone ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], providerPhone: e.target.value } }))} placeholder="Phone (optional)" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #fde68a', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '4px' }} />
                                          <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#92400e', display: 'block', marginBottom: '3px' }}>Scheduled date &amp; time</label>
                                          <input type="datetime-local" value={dispatchFormData[b.id]?.scheduledTime ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], scheduledTime: e.target.value } }))} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #fde68a', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }} />
                                          <ActionBtn label={isLoading ? 'Assigning…' : 'Assign partner provider'} onClick={() => handleDispatch(b.id, 'partner_network', { assigned_provider: dispatchFormData[b.id]?.providerName ?? 'Partner network', provider_phone: dispatchFormData[b.id]?.providerPhone ?? '', scheduled_time: dispatchFormData[b.id]?.scheduledTime ?? '', arrangement: 'Via partner network' })} disabled={isLoading || !dispatchFormData[b.id]?.scheduledTime} color="white" bg="#b45309" />
                                        </DispatchForm>
                                      )}
                                    </div>
                                  )}

                                  {/* HEALTH SERVICES (telehealth) */}
                                  {b.service_type === 'telehealth' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '2px' }}>Service sub-type</label>
                                      <select value={dispatchFormData[b.id]?.healthSubtype ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], healthSubtype: e.target.value } }))} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: 'var(--radius-sm)', padding: '7px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }}>
                                        <option value="">Select health service type…</option>
                                        <option>Telehealth Consultation</option>
                                        <option>Mental Health Support</option>
                                        <option>Medication Review</option>
                                        <option>Physical Therapy</option>
                                        <option>Home Health Aide</option>
                                        <option>Hospice/Palliative Care Referral</option>
                                        <option>Other Health Service</option>
                                      </select>

                                      {/* Telehealth Consultation */}
                                      {dispatchFormData[b.id]?.healthSubtype === 'Telehealth Consultation' && (
                                        <>
                                          <DispatchBtn icon="🩺" label="Schedule telehealth appointment" isActive={activeDispatch[b.id] === 'telehealth_appt'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'telehealth_appt' ? null : 'telehealth_appt' }))} />
                                          {activeDispatch[b.id] === 'telehealth_appt' && (
                                            <DispatchForm bg="#eff6ff" border="#bfdbfe">
                                              <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#1e40af', display: 'block', marginBottom: '3px' }}>Provider name</label>
                                              <input type="text" value={dispatchFormData[b.id]?.providerName ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], providerName: e.target.value } }))} placeholder="Doctor / provider name" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #bfdbfe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '4px' }} />
                                              <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#1e40af', display: 'block', marginBottom: '3px' }}>Platform</label>
                                              <select value={dispatchFormData[b.id]?.platform ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], platform: e.target.value } }))} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #bfdbfe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '4px' }}>
                                                <option value="">Select platform…</option>
                                                <option>Teladoc (stub)</option>
                                                <option>Amwell (stub)</option>
                                                <option>Navigator will arrange</option>
                                              </select>
                                              <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#1e40af', display: 'block', marginBottom: '3px' }}>Appointment date &amp; time</label>
                                              <input type="datetime-local" value={dispatchFormData[b.id]?.scheduledTime ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], scheduledTime: e.target.value } }))} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #bfdbfe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }} />
                                              <ActionBtn label={isLoading ? 'Scheduling…' : 'Schedule appointment'} onClick={() => handleDispatch(b.id, 'telehealth_appt', { health_subtype: 'Telehealth Consultation', assigned_provider: dispatchFormData[b.id]?.providerName ?? '', platform: dispatchFormData[b.id]?.platform ?? '', scheduled_time: dispatchFormData[b.id]?.scheduledTime ?? '' })} disabled={isLoading || !dispatchFormData[b.id]?.providerName?.trim() || !dispatchFormData[b.id]?.scheduledTime} color="white" bg="#1d4ed8" />
                                            </DispatchForm>
                                          )}
                                        </>
                                      )}

                                      {/* Mental Health Support */}
                                      {dispatchFormData[b.id]?.healthSubtype === 'Mental Health Support' && (
                                        <>
                                          <DispatchBtn icon="🧠" label="Refer to mental health professional" isActive={activeDispatch[b.id] === 'mental_health'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'mental_health' ? null : 'mental_health' }))} />
                                          {activeDispatch[b.id] === 'mental_health' && (
                                            <DispatchForm bg="#faf5ff" border="#d8b4fe">
                                              <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#6b21a8', display: 'block', marginBottom: '3px' }}>Therapist / counselor name</label>
                                              <input type="text" value={dispatchFormData[b.id]?.therapistName ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], therapistName: e.target.value } }))} placeholder="Name" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #d8b4fe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '4px' }} />
                                              <input type="text" value={dispatchFormData[b.id]?.therapistContact ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], therapistContact: e.target.value } }))} placeholder="Contact info (phone or email)" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #d8b4fe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '4px' }} />
                                              <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#6b21a8', display: 'block', marginBottom: '3px' }}>Follow-up check-in date</label>
                                              <input type="date" value={dispatchFormData[b.id]?.followUpDate ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], followUpDate: e.target.value } }))} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #d8b4fe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }} />
                                              <ActionBtn label={isLoading ? 'Saving…' : 'Record referral'} onClick={() => handleDispatch(b.id, 'mental_health', { health_subtype: 'Mental Health Support', assigned_provider: dispatchFormData[b.id]?.therapistName ?? '', provider_contact: dispatchFormData[b.id]?.therapistContact ?? '', follow_up_date: dispatchFormData[b.id]?.followUpDate ?? '' })} disabled={isLoading || !dispatchFormData[b.id]?.therapistName?.trim()} color="white" bg="#7c3aed" />
                                            </DispatchForm>
                                          )}
                                        </>
                                      )}

                                      {/* Medication Review */}
                                      {dispatchFormData[b.id]?.healthSubtype === 'Medication Review' && (
                                        <>
                                          <DispatchBtn icon="💊" label="Create medication review task" isActive={activeDispatch[b.id] === 'med_review'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'med_review' ? null : 'med_review' }))} />
                                          {activeDispatch[b.id] === 'med_review' && (
                                            <DispatchForm bg="#fff7ed" border="#fed7aa">
                                              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#c2410c', margin: '0 0 8px', lineHeight: 1.4 }}>
                                                Creates a navigator task to review this member&apos;s medication list with their primary care doctor.
                                              </p>
                                              <ActionBtn label={isLoading ? 'Creating task…' : 'Create medication review task'} onClick={() => handleDispatch(b.id, 'med_review', { health_subtype: 'Medication Review', arrangement: 'Navigator will coordinate medication review with PCP' })} disabled={isLoading} color="white" bg="#ea580c" />
                                            </DispatchForm>
                                          )}
                                        </>
                                      )}

                                      {/* Home Health Aide */}
                                      {dispatchFormData[b.id]?.healthSubtype === 'Home Health Aide' && (
                                        <>
                                          <DispatchBtn icon="🏥" label="Assign home health aide" isActive={activeDispatch[b.id] === 'health_aide'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'health_aide' ? null : 'health_aide' }))} />
                                          {activeDispatch[b.id] === 'health_aide' && (() => {
                                            const vkey = `${b.id}_health_aide`
                                            const picked = selectedVolunteer[vkey] ?? null
                                            return (
                                              <DispatchForm bg="#f0fdf4" border="#86efac">
                                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#065f46', margin: '0 0 6px' }}>Assign from platform volunteers:</p>
                                                <VolunteerPicker visitType="in_person_visit" selectedId={picked?.id} onSelect={vol => setSelectedVolunteer(prev => ({ ...prev, [vkey]: vol }))} />
                                                {picked && <VolunteerConfirmCard volunteer={picked} />}
                                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#374151', margin: '6px 0 2px', fontStyle: 'italic' }}>Or enter an external aide&apos;s name:</p>
                                                <input type="text" value={dispatchFormData[b.id]?.providerName ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], providerName: e.target.value } }))} placeholder="External aide name (optional)" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '6px' }} />
                                                <ActionBtn label={isLoading ? 'Assigning…' : 'Assign aide'} onClick={() => handleDispatch(b.id, 'health_aide', { health_subtype: 'Home Health Aide', assigned_volunteer: picked?.full_name ?? dispatchFormData[b.id]?.providerName ?? '' }, picked?.id)} disabled={isLoading || (!picked && !dispatchFormData[b.id]?.providerName?.trim())} color="white" bg="#059669" />
                                              </DispatchForm>
                                            )
                                          })()}
                                        </>
                                      )}

                                      {/* Hospice/Palliative Care — high priority */}
                                      {dispatchFormData[b.id]?.healthSubtype === 'Hospice/Palliative Care Referral' && (
                                        <>
                                          <DispatchBtn icon="🔔" label="Request hospice consultation (urgent)" isActive={activeDispatch[b.id] === 'hospice'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'hospice' ? null : 'hospice' }))} />
                                          {activeDispatch[b.id] === 'hospice' && (
                                            <DispatchForm bg="#fff1f2" border="#fca5a5">
                                              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#9f1239', margin: '0 0 8px', lineHeight: 1.4, fontWeight: 600 }}>
                                                ⚠️ This creates an urgent navigator task, notifies the care team, and updates this member&apos;s check-in frequency to daily.
                                              </p>
                                              <ActionBtn label={isLoading ? 'Creating urgent task…' : 'Request hospice consultation'} onClick={() => { console.log(`[STUB][EMAIL] Would notify care team: URGENT hospice consultation request for member ${b.member_id}`); handleDispatch(b.id, 'hospice', { health_subtype: 'Hospice/Palliative Care Referral', arrangement: 'URGENT: Hospice consultation requested — care team notified' }) }} disabled={isLoading} color="white" bg="#be123c" />
                                            </DispatchForm>
                                          )}
                                        </>
                                      )}

                                      {/* Physical Therapy / Other */}
                                      {(dispatchFormData[b.id]?.healthSubtype === 'Physical Therapy' || dispatchFormData[b.id]?.healthSubtype === 'Other Health Service') && (
                                        <>
                                          <DispatchBtn icon="📋" label="Schedule service / assign provider" isActive={activeDispatch[b.id] === 'health_general'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'health_general' ? null : 'health_general' }))} />
                                          {activeDispatch[b.id] === 'health_general' && (
                                            <DispatchForm bg="#eff6ff" border="#bfdbfe">
                                              <input type="text" value={dispatchFormData[b.id]?.providerName ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], providerName: e.target.value } }))} placeholder="Provider name" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #bfdbfe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '4px' }} />
                                              <input type="datetime-local" value={dispatchFormData[b.id]?.scheduledTime ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], scheduledTime: e.target.value } }))} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #bfdbfe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }} />
                                              <ActionBtn label={isLoading ? 'Saving…' : 'Confirm service'} onClick={() => handleDispatch(b.id, 'health_general', { health_subtype: dispatchFormData[b.id]?.healthSubtype ?? '', assigned_provider: dispatchFormData[b.id]?.providerName ?? '', scheduled_time: dispatchFormData[b.id]?.scheduledTime ?? '' })} disabled={isLoading || !dispatchFormData[b.id]?.providerName?.trim()} color="white" bg="#1d4ed8" />
                                            </DispatchForm>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}

                                  {/* LEGAL & FINANCIAL */}
                                  {b.service_type === 'legal_financial' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '2px' }}>Service sub-type</label>
                                      <select value={dispatchFormData[b.id]?.healthSubtype ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], healthSubtype: e.target.value } }))} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: 'var(--radius-sm)', padding: '7px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }}>
                                        <option value="">Select service type…</option>
                                        <option>Elder Law Attorney</option>
                                        <option>Estate Planning Attorney</option>
                                        <option>Financial Advisor / Planner</option>
                                        <option>Benefits Counselor</option>
                                        <option>Medicare / Medicaid Advisor</option>
                                        <option>Power of Attorney Assistance</option>
                                        <option>SHIP Counselor (Medicare Help)</option>
                                        <option>Other Legal / Financial</option>
                                      </select>

                                      {/* Connect with navigator-vetted provider */}
                                      {dispatchFormData[b.id]?.healthSubtype && dispatchFormData[b.id]?.healthSubtype !== 'SHIP Counselor (Medicare Help)' && (
                                        <>
                                          <DispatchBtn icon="🤝" label="Connect with vetted provider" isActive={activeDispatch[b.id] === 'legal_vetted'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'legal_vetted' ? null : 'legal_vetted' }))} />
                                          {activeDispatch[b.id] === 'legal_vetted' && (
                                            <DispatchForm bg="#f5f3ff" border="#d8b4fe">
                                              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#6b21a8', margin: '0 0 6px', lineHeight: 1.4 }}>
                                                Our navigators provide a warm, personal introduction — never just a phone number.
                                              </p>
                                              <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#6b21a8', display: 'block', marginBottom: '3px' }}>Provider name</label>
                                              <input type="text" value={dispatchFormData[b.id]?.providerName ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], providerName: e.target.value } }))} placeholder="Attorney / advisor name (optional)" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #d8b4fe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '4px' }} />
                                              <input type="tel" value={dispatchFormData[b.id]?.providerPhone ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], providerPhone: e.target.value } }))} placeholder="Contact phone (optional)" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #d8b4fe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '4px' }} />
                                              <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#6b21a8', display: 'block', marginBottom: '3px' }}>Scheduled date (optional)</label>
                                              <input type="date" value={(dispatchFormData[b.id]?.scheduledTime ?? '').slice(0, 10)} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], scheduledTime: e.target.value } }))} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #d8b4fe', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }} />
                                              <ActionBtn label={isLoading ? 'Recording…' : 'Record referral & confirm'} onClick={() => handleDispatch(b.id, 'legal_vetted', { legal_subtype: dispatchFormData[b.id]?.healthSubtype ?? '', assigned_provider: dispatchFormData[b.id]?.providerName ?? 'Navigator will connect', provider_phone: dispatchFormData[b.id]?.providerPhone ?? '', scheduled_time: dispatchFormData[b.id]?.scheduledTime ?? '', arrangement: `Warm referral to ${dispatchFormData[b.id]?.healthSubtype ?? 'legal/financial professional'}` })} disabled={isLoading} color="white" bg="#7c3aed" />
                                            </DispatchForm>
                                          )}
                                        </>
                                      )}

                                      {/* SHIP Counselor */}
                                      {dispatchFormData[b.id]?.healthSubtype === 'SHIP Counselor (Medicare Help)' && (
                                        <>
                                          <DispatchBtn icon="📋" label="Request SHIP counselor (free Medicare help)" isActive={activeDispatch[b.id] === 'ship'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'ship' ? null : 'ship' }))} />
                                          {activeDispatch[b.id] === 'ship' && (
                                            <DispatchForm bg="#eff6ff" border="#bfdbfe">
                                              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#1e40af', margin: '0 0 6px', lineHeight: 1.4 }}>
                                                SHIP (State Health Insurance Assistance Program) provides free, unbiased Medicare counseling.
                                              </p>
                                              <ActionBtn label={isLoading ? 'Connecting…' : 'Connect to SHIP counselor (stub)'} onClick={() => { console.log(`[STUB][SHIP] Would connect member ${b.member_id} to local SHIP counselor`); handleDispatch(b.id, 'ship', { legal_subtype: 'SHIP Counselor', arrangement: 'SHIP Medicare counselor referral — navigator will arrange introduction' }) }} disabled={isLoading} color="white" bg="#1d4ed8" />
                                            </DispatchForm>
                                          )}
                                        </>
                                      )}

                                      {/* Add to benefits finder */}
                                      <DispatchBtn icon="🔍" label="Flag for benefits finder review" isActive={activeDispatch[b.id] === 'benefits_flag'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'benefits_flag' ? null : 'benefits_flag' }))} />
                                      {activeDispatch[b.id] === 'benefits_flag' && (
                                        <DispatchForm bg="#f0fdf4" border="#86efac">
                                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#065f46', margin: '0 0 6px', lineHeight: 1.4 }}>
                                            Flag this member for a full benefits review session — navigator will run through all eligible programs.
                                          </p>
                                          <ActionBtn label={isLoading ? 'Flagging…' : 'Flag for benefits review'} onClick={() => handleDispatch(b.id, 'benefits_flag', { legal_subtype: 'Benefits Review', arrangement: 'Member flagged for comprehensive benefits finder review' })} disabled={isLoading} color="white" bg="#059669" />
                                        </DispatchForm>
                                      )}

                                      {/* Fraud/scam alert */}
                                      <DispatchBtn icon="⚠️" label="Flag potential fraud / scam concern" isActive={activeDispatch[b.id] === 'fraud_flag'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'fraud_flag' ? null : 'fraud_flag' }))} />
                                      {activeDispatch[b.id] === 'fraud_flag' && (
                                        <DispatchForm bg="#fff1f2" border="#fca5a5">
                                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#9f1239', margin: '0 0 6px', lineHeight: 1.4, fontWeight: 600 }}>
                                            ⚠️ Flag this member&apos;s situation for fraud/scam awareness review. A navigator will follow up immediately.
                                          </p>
                                          <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#9f1239', display: 'block', marginBottom: '3px' }}>Concern details</label>
                                          <input type="text" value={dispatchFormData[b.id]?.arrangement ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], arrangement: e.target.value } }))} placeholder="Describe the suspected scam or fraud concern…" style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }} />
                                          <ActionBtn label={isLoading ? 'Flagging…' : 'Flag fraud concern (urgent)'} onClick={() => { console.log(`[STUB][FRAUD] Would alert care team: fraud concern for member ${b.member_id}`); handleDispatch(b.id, 'fraud_flag', { legal_subtype: 'Fraud Alert', arrangement: `FRAUD CONCERN: ${dispatchFormData[b.id]?.arrangement ?? ''}` }) }} disabled={isLoading || !dispatchFormData[b.id]?.arrangement?.trim()} color="white" bg="#be123c" />
                                        </DispatchForm>
                                      )}
                                    </div>
                                  )}

                                  {/* COMPANIONSHIP & SOCIAL */}
                                  {b.service_type === 'companionship' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <DispatchBtn icon="🤝" label="Assign volunteer companion" isActive={activeDispatch[b.id] === 'volunteer_companion'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'volunteer_companion' ? null : 'volunteer_companion' }))} />
                                      {activeDispatch[b.id] === 'volunteer_companion' && (() => {
                                        const vkey = `${b.id}_volunteer_companion`
                                        const picked = selectedVolunteer[vkey] ?? null
                                        const subtype = (b.booking_details as Record<string, string>)?.subtype ?? 'friendly_visit'
                                        return (
                                          <DispatchForm bg="#fff1f2" border="#fecaca">
                                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#9f1239', margin: '0 0 6px' }}>
                                              Select a companion volunteer (filtered for {subtype.replace(/_/g, ' ')}):
                                            </p>
                                            <VolunteerPicker visitType={subtype} selectedId={picked?.id} onSelect={vol => setSelectedVolunteer(prev => ({ ...prev, [vkey]: vol }))} />
                                            {picked && <VolunteerConfirmCard volunteer={picked} />}
                                            <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#9f1239', display: 'block', marginTop: '6px', marginBottom: '3px' }}>Scheduled visit date &amp; time</label>
                                            <input type="datetime-local" value={dispatchFormData[b.id]?.scheduledTime ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], scheduledTime: e.target.value } }))} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }} />
                                            <ActionBtn label={isLoading ? 'Assigning…' : 'Assign companion'} onClick={() => handleDispatch(b.id, 'volunteer_companion', { assigned_volunteer: picked?.full_name ?? '', scheduled_time: dispatchFormData[b.id]?.scheduledTime ?? '' }, picked?.id)} disabled={isLoading || !picked} color="white" bg="#be123c" />
                                          </DispatchForm>
                                        )
                                      })()}
                                      <DispatchBtn icon="📞" label="Schedule phone friendship call" isActive={activeDispatch[b.id] === 'phone_companion'} onClick={() => setActiveDispatch(prev => ({ ...prev, [b.id]: prev[b.id] === 'phone_companion' ? null : 'phone_companion' }))} />
                                      {activeDispatch[b.id] === 'phone_companion' && (() => {
                                        const vkey = `${b.id}_phone_companion`
                                        const picked = selectedVolunteer[vkey] ?? null
                                        return (
                                          <DispatchForm bg="#f0fdf4" border="#86efac">
                                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#065f46', margin: '0 0 6px' }}>Select a phone companion volunteer:</p>
                                            <VolunteerPicker visitType="phone_call" selectedId={picked?.id} onSelect={vol => setSelectedVolunteer(prev => ({ ...prev, [vkey]: vol }))} />
                                            {picked && <VolunteerConfirmCard volunteer={picked} />}
                                            <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#065f46', display: 'block', marginTop: '6px', marginBottom: '3px' }}>Scheduled call date &amp; time</label>
                                            <input type="datetime-local" value={dispatchFormData[b.id]?.scheduledTime ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [b.id]: { ...prev[b.id], scheduledTime: e.target.value } }))} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', marginBottom: '8px' }} />
                                            <ActionBtn label={isLoading ? 'Scheduling…' : 'Schedule call'} onClick={() => handleDispatch(b.id, 'phone_companion', { assigned_volunteer: picked?.full_name ?? '', scheduled_time: dispatchFormData[b.id]?.scheduledTime ?? '' }, picked?.id)} disabled={isLoading || !picked} color="white" bg="#059669" />
                                          </DispatchForm>
                                        )
                                      })()}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          marginBottom: '10px',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
      <span style={{ color: 'var(--color-text-secondary)', minWidth: '140px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  )
}

function ContactCard({ name, phone, rel }: { name: string; phone: string | null; rel: string | null }) {
  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '8px' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)' }}>
        {name}{rel && <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: '6px', fontSize: '13px' }}>({rel})</span>}
      </div>
      {phone && <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{phone}</div>}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
      {text}
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
        {value}
      </div>
    </div>
  )
}

function ActionBtn({ label, onClick, disabled, color, bg }: { label: string; onClick: () => void; disabled: boolean; color: string; bg: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: '12px',
        fontWeight: 600,
        color: disabled ? '#9ca3af' : color,
        backgroundColor: disabled ? '#f3f4f6' : bg,
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        transition: 'opacity 0.15s',
      }}
    >
      {label}
    </button>
  )
}

function DispatchBtn({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        fontFamily: 'var(--font-body)',
        fontSize: '12px',
        fontWeight: 600,
        color: isActive ? 'var(--color-teal)' : 'var(--color-text-primary)',
        backgroundColor: isActive ? 'rgba(26,122,106,0.07)' : 'white',
        border: isActive ? '1.5px solid rgba(26,122,106,0.3)' : '1.5px solid var(--color-warm-grey)',
        borderRadius: 'var(--radius-sm)',
        padding: '7px 12px',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.12s',
      }}
    >
      <span>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ fontSize: '10px', color: '#9ca3af' }}>{isActive ? '▲' : '▼'}</span>
    </button>
  )
}

function DispatchForm({ bg, border, children }: { bg: string; border: string; children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: bg,
      border: `1px solid ${border}`,
      borderRadius: 'var(--radius-sm)',
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      {children}
    </div>
  )
}

// Service provider picker — fetches from service_providers table filtered by service type
function ServiceProviderPicker({
  serviceType,
  selectedProviderName,
  onSelect,
}: {
  serviceType: string
  selectedProviderName?: string
  onSelect: (name: string) => void
}) {
  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState<Array<{ id: string; full_name: string; company_name: string | null; phone: string | null; rating_average: number | null; city: string | null }>>([])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/service-providers?serviceType=${encodeURIComponent(serviceType)}`)
      .then(r => r.json())
      .then(d => { setProviders(d.providers ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [serviceType])

  if (loading) return <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', padding: '6px 0' }}>Loading providers…</div>
  if (providers.length === 0) return <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', padding: '6px 0' }}>No vetted providers found. Enter manually below.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto', marginBottom: '4px' }}>
      {providers.map(p => {
        const displayName = p.company_name ? `${p.full_name} — ${p.company_name}` : p.full_name
        const isSelected = selectedProviderName === displayName
        return (
          <button key={p.id} type="button" onClick={() => onSelect(displayName)} style={{ textAlign: 'left', background: isSelected ? '#dbeafe' : 'white', border: isSelected ? '2px solid #3b82f6' : '1px solid #d1d5db', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer', transition: 'border 0.1s, background 0.1s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--color-navy)' }}>{displayName}</span>
              {p.rating_average != null && <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#ca8a04' }}>⭐ {Number(p.rating_average).toFixed(1)}</span>}
            </div>
            {p.phone && <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{p.phone}{p.city ? ` · ${p.city}` : ''}</div>}
          </button>
        )
      })}
    </div>
  )
}

// Reassign panel — same dispatch options as initial dispatch, but sends action='reassign'
function ReassignPanel({
  bookingId,
  serviceType,
  isLoading,
  dispatchFormData,
  setDispatchFormData,
  selectedVolunteer,
  setSelectedVolunteer,
  onReassign,
}: {
  bookingId: string
  serviceType: string
  isLoading: boolean
  dispatchFormData: Record<string, { scheduledTime?: string; providerName?: string; arrangement?: string }>
  setDispatchFormData: React.Dispatch<React.SetStateAction<Record<string, { scheduledTime?: string; providerName?: string; providerCompany?: string; providerPhone?: string; arrangement?: string; healthSubtype?: string; platform?: string; therapistName?: string; therapistContact?: string; followUpDate?: string }>>>
  selectedVolunteer: Record<string, Volunteer | null>
  setSelectedVolunteer: React.Dispatch<React.SetStateAction<Record<string, Volunteer | null>>>
  onReassign: (dispatchType: string, dispatchDetails: Record<string, string>, volunteerId?: string) => void
}) {
  const [innerDispatch, setInnerDispatch] = useState<string | null>(null)

  // Determine which volunteer types to show based on service type
  const getVisitType = (dtype: string): string => {
    if (dtype === 'volunteer_driver') return 'walking_companion'
    if (dtype === 'volunteer_tech' || dtype === 'inHome_visit') return 'tech_help'
    if (dtype === 'volunteer_meals') return 'grocery_help'
    return 'in_person_visit'
  }

  return (
    <div style={{ backgroundColor: '#faf5ff', border: '1px solid #d8b4fe', borderRadius: 'var(--radius-sm)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b21a8', margin: '0 0 4px' }}>Reassign to a different resource</p>

      {/* Show relevant dispatch options based on service type */}
      {(serviceType === 'transport' || serviceType === 'tech_help' || serviceType === 'meals' || serviceType === 'home_service') && (
        <>
          {['transport', 'tech_help', 'meals', 'home_service'].includes(serviceType) && (() => {
            const dtype = serviceType === 'transport' ? 'volunteer_driver'
              : serviceType === 'tech_help' ? 'volunteer_tech'
              : serviceType === 'meals' ? 'volunteer_meals'
              : 'home_volunteer'
            const vkey = `${bookingId}_reassign_${dtype}`
            const picked = selectedVolunteer[vkey] ?? null
            const visitType = getVisitType(dtype)
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button type="button" onClick={() => setInnerDispatch(p => p === dtype ? null : dtype)} style={{ width: '100%', textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: innerDispatch === dtype ? '#6b21a8' : '#374151', background: innerDispatch === dtype ? 'rgba(109,40,217,0.06)' : 'white', border: innerDispatch === dtype ? '1.5px solid #d8b4fe' : '1.5px solid #e5e7eb', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  🙋 Assign different volunteer{innerDispatch === dtype ? ' ▲' : ' ▼'}
                </button>
                {innerDispatch === dtype && (
                  <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                    <VolunteerPicker visitType={visitType} selectedId={picked?.id} onSelect={vol => setSelectedVolunteer(prev => ({ ...prev, [vkey]: vol }))} />
                    {picked && <VolunteerConfirmCard volunteer={picked} />}
                    <button type="button" onClick={() => onReassign(dtype, { assigned_volunteer: picked?.full_name ?? '' }, picked?.id)} disabled={isLoading || !picked} style={{ marginTop: '4px', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'white', backgroundColor: isLoading || !picked ? '#9ca3af' : '#7c3aed', border: 'none', borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: isLoading || !picked ? 'not-allowed' : 'pointer' }}>
                      {isLoading ? 'Reassigning…' : 'Confirm reassignment'}
                    </button>
                  </div>
                )}
              </div>
            )
          })()}
        </>
      )}

      {/* Manual provider reassignment for home_service / telehealth */}
      {(serviceType === 'home_service' || serviceType === 'telehealth') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button type="button" onClick={() => setInnerDispatch(p => p === 'manual_reassign' ? null : 'manual_reassign')} style={{ width: '100%', textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#374151', background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer' }}>
            ✏️ Enter provider name manually{innerDispatch === 'manual_reassign' ? ' ▲' : ' ▼'}
          </button>
          {innerDispatch === 'manual_reassign' && (
            <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 'var(--radius-sm)', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input type="text" value={dispatchFormData[bookingId]?.providerName ?? ''} onChange={e => setDispatchFormData(prev => ({ ...prev, [bookingId]: { ...prev[bookingId], providerName: e.target.value } }))} placeholder="New provider / volunteer name" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => onReassign('vetted_provider', { assigned_provider: dispatchFormData[bookingId]?.providerName ?? '' })} disabled={isLoading || !dispatchFormData[bookingId]?.providerName?.trim()} style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'white', backgroundColor: isLoading || !dispatchFormData[bookingId]?.providerName?.trim() ? '#9ca3af' : '#7c3aed', border: 'none', borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: 'pointer' }}>
                {isLoading ? 'Reassigning…' : 'Confirm reassignment'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Volunteer picker — fetches active volunteers filtered by visit_type, displays as selectable cards
function VolunteerPicker({
  visitType,
  selectedId,
  onSelect,
}: {
  visitType: string
  selectedId?: string
  onSelect: (vol: Volunteer) => void
}) {
  const [loading, setLoading] = useState(true)
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setFetchError(null)
    fetch(`/api/volunteers/active?serviceType=${encodeURIComponent(visitType)}`)
      .then(r => r.json())
      .then(d => {
        setVolunteers(d.volunteers ?? [])
        setLoading(false)
      })
      .catch(() => {
        setFetchError('Could not load volunteers.')
        setLoading(false)
      })
  }, [visitType])

  if (loading) {
    return (
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', padding: '8px 0' }}>
        Loading volunteers…
      </div>
    )
  }

  if (fetchError) {
    return (
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-emergency-text)', padding: '6px 0' }}>
        {fetchError}
      </div>
    )
  }

  if (volunteers.length === 0) {
    return (
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', padding: '6px 0', lineHeight: 1.5 }}>
        No active volunteers available for this service type.{' '}
        <a href="/volunteer/apply" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-teal)', textDecoration: 'underline' }}>
          Add a volunteer →
        </a>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '210px', overflowY: 'auto', marginBottom: '6px' }}>
      {volunteers.map(vol => {
        const isSelected = vol.id === selectedId
        const availDays = (vol.availability_days as string[] | null)?.join(', ') ?? '—'
        const location = [vol.city, vol.state].filter(Boolean).join(', ') || '—'
        return (
          <button
            key={vol.id}
            type="button"
            onClick={() => onSelect(vol)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: isSelected ? '#e6f7f3' : 'white',
              border: isSelected ? '2px solid var(--color-teal)' : '1px solid #d1d5db',
              borderRadius: 'var(--radius-sm)',
              padding: '7px 10px',
              cursor: 'pointer',
              transition: 'border 0.1s, background 0.1s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)' }}>
                {vol.full_name}
              </span>
              {vol.rating_average != null && (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#ca8a04' }}>
                  ⭐ {Number(vol.rating_average).toFixed(1)}
                </span>
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {location} · {availDays} · {(vol.hours_per_week as string | null) ?? '—'} hrs/wk
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Confirmation card shown after a volunteer is selected — displays key details before saving
function VolunteerConfirmCard({ volunteer }: { volunteer: Volunteer }) {
  const langs = (volunteer.languages as string[] | null)?.join(', ') || '—'
  const serviceTypes = (volunteer.service_types as string[] | null)?.join(', ') || '—'
  const availability = (volunteer.availability_days as string[] | null)?.join(', ') || '—'
  return (
    <div style={{
      backgroundColor: '#f0fdf4',
      border: '1px solid #86efac',
      borderRadius: 'var(--radius-sm)',
      padding: '8px 10px',
      marginBottom: '6px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: '#065f46' }}>
        ✓ Selected: {volunteer.full_name}
      </div>
      {volunteer.phone && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#065f46' }}>
          📞 <a href={`tel:${volunteer.phone}`} style={{ color: '#065f46' }}>{volunteer.phone}</a>
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#065f46' }}>
        🌐 {langs}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#065f46' }}>
        📋 {serviceTypes}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#065f46' }}>
        🗓 Available: {availability} · {(volunteer.hours_per_week as string | null) ?? '—'} hrs/wk
      </div>
    </div>
  )
}
