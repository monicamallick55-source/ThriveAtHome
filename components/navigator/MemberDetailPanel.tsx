'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Member } from '@/lib/data/members'
import type { CheckInCall } from '@/lib/data/calls'
import type { FamilyMember, NavigatorNote } from '@/lib/data/navigator'

interface PanelData {
  member: Member
  calls: CheckInCall[]
  family: FamilyMember[]
  notes: NavigatorNote[]
  brief: string
  navigatorId: string
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
