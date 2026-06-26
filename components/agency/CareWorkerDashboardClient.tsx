'use client'

import { useState, useTransition } from 'react'
import type { CareWorkerRow, CareVisitRow } from '@/types/database'

interface CareVisitWithMember extends CareVisitRow {
  member?: { preferred_name: string; full_name: string; address: string | null; phone_number?: string | null } | null
}

interface CareWorkerDashboardClientProps {
  worker: CareWorkerRow
  todaysVisits: CareVisitWithMember[]
}

function formatTime(t: string | null): string {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  missed: 'Missed',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: '#EFF6FF', text: '#1D4ED8' },
  in_progress: { bg: '#ECFDF5', text: '#065F46' },
  completed: { bg: '#F3F4F6', text: '#374151' },
  cancelled: { bg: '#FEF2F2', text: '#991B1B' },
  missed: { bg: '#FFFBEB', text: '#92400E' },
}

export default function CareWorkerDashboardClient({ worker, todaysVisits }: CareWorkerDashboardClientProps) {
  const [visits, setVisits] = useState(todaysVisits)
  const [checkoutNotes, setCheckoutNotes] = useState<Record<string, string>>({})
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  async function handleCheckIn(visitId: string) {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await fetch('/api/agency/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visit_id: visitId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrorMsg(json.error ?? 'Check-in failed')
        return
      }
      setVisits((prev) =>
        prev.map((v) => v.id === visitId ? { ...v, status: 'in_progress', actual_check_in_at: json.visit?.actual_check_in_at } : v)
      )
    })
  }

  async function handleCheckOut(visitId: string) {
    setErrorMsg(null)
    const notes = checkoutNotes[visitId] ?? ''
    startTransition(async () => {
      const res = await fetch('/api/agency/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visit_id: visitId, notes }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrorMsg(json.error ?? 'Check-out failed')
        return
      }
      setVisits((prev) =>
        prev.map((v) => v.id === visitId ? { ...v, status: 'completed', actual_check_out_at: json.visit?.actual_check_out_at, billable_hours: json.visit?.billable_hours } : v)
      )
      setExpandedVisit(null)
      setCheckoutNotes((prev) => { const n = { ...prev }; delete n[visitId]; return n })
    })
  }

  const completedCount = visits.filter((v) => v.status === 'completed').length
  const totalHours = visits.filter((v) => v.status === 'completed').reduce((sum, v) => sum + (v.billable_hours ?? 0), 0)

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F9FAFB', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-navy)', padding: '20px 20px 24px', color: '#fff' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '4px' }}>{today}</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, margin: 0 }}>
          Hi, {worker.full_name.split(' ')[0]}
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
          {visits.length} visit{visits.length !== 1 ? 's' : ''} today
        </p>
      </div>

      {/* Progress bar */}
      {visits.length > 0 && (
        <div style={{ backgroundColor: 'var(--color-navy)', padding: '0 20px 20px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#34D399', height: '100%', width: `${(completedCount / visits.length) * 100}%`, borderRadius: '8px', transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
            <span>{completedCount} of {visits.length} completed</span>
            <span>{totalHours.toFixed(2)}h billed today</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div style={{ margin: '16px 20px 0', padding: '12px 16px', backgroundColor: '#FEF2F2', borderRadius: '8px', color: '#991B1B', fontSize: '14px' }}>
          {errorMsg}
        </div>
      )}

      {/* Visit list */}
      <main style={{ padding: '20px' }}>
        {visits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>No visits scheduled today</h2>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Check back tomorrow or contact your supervisor.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visits.map((visit, index) => {
              const member = visit.member
              const colors = STATUS_COLORS[visit.status] ?? STATUS_COLORS.scheduled
              const isExpanded = expandedVisit === visit.id
              const isInProgress = visit.status === 'in_progress'
              const isScheduled = visit.status === 'scheduled'

              return (
                <div
                  key={visit.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    boxShadow: isInProgress ? '0 0 0 2px #059669, 0 2px 8px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Visit header */}
                  <div
                    style={{ padding: '16px 18px', cursor: 'pointer' }}
                    onClick={() => setExpandedVisit(isExpanded ? null : visit.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Visit {index + 1}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-navy)' }}>
                          {member?.preferred_name || member?.full_name || 'Client'}
                        </div>
                      </div>
                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, backgroundColor: colors.bg, color: colors.text }}>
                        {STATUS_LABELS[visit.status]}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      <span>⏰ {formatTime(visit.scheduled_start_time)} – {formatTime(visit.scheduled_end_time)}</span>
                      <span>📋 {visit.visit_type?.replace(/_/g, ' ')}</span>
                    </div>
                    {member?.address && (
                      <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        📍 {member.address}
                      </div>
                    )}
                  </div>

                  {/* Expanded details + actions */}
                  {isExpanded && (
                    <div style={{ padding: '0 18px 18px', borderTop: '1px solid #F3F4F6' }}>
                      {member?.phone_number && (
                        <div style={{ paddingTop: '14px', marginBottom: '12px' }}>
                          <a
                            href={`tel:${member.phone_number}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#EFF6FF', borderRadius: '8px', color: '#1D4ED8', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}
                          >
                            📞 Call {member.preferred_name || member.full_name}
                          </a>
                        </div>
                      )}

                      {visit.actual_check_in_at && (
                        <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          Checked in: {new Date(visit.actual_check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {visit.actual_check_out_at && (
                        <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          Checked out: {new Date(visit.actual_check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {visit.billable_hours != null && ` · ${visit.billable_hours}h billed`}
                        </div>
                      )}

                      {/* Check-in button */}
                      {isScheduled && (
                        <button
                          onClick={() => handleCheckIn(visit.id)}
                          disabled={isPending}
                          style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: '#059669',
                            color: '#fff',
                            fontSize: '16px',
                            fontWeight: 700,
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            opacity: isPending ? 0.7 : 1,
                          }}
                        >
                          {isPending ? 'Checking in...' : 'Check In'}
                        </button>
                      )}

                      {/* Check-out section */}
                      {isInProgress && (
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                            Visit Notes (optional)
                          </label>
                          <textarea
                            value={checkoutNotes[visit.id] ?? ''}
                            onChange={(e) => setCheckoutNotes((prev) => ({ ...prev, [visit.id]: e.target.value }))}
                            placeholder="How did the visit go? Any observations to note..."
                            rows={3}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
                          />
                          <button
                            onClick={() => handleCheckOut(visit.id)}
                            disabled={isPending}
                            style={{
                              width: '100%',
                              marginTop: '10px',
                              padding: '14px',
                              borderRadius: '10px',
                              border: 'none',
                              backgroundColor: 'var(--color-navy)',
                              color: '#fff',
                              fontSize: '16px',
                              fontWeight: 700,
                              cursor: isPending ? 'not-allowed' : 'pointer',
                              opacity: isPending ? 0.7 : 1,
                            }}
                          >
                            {isPending ? 'Checking out...' : 'Check Out & Complete Visit'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
