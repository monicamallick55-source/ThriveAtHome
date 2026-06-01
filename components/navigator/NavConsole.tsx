'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import type { CaseloadEntry, NavigatorTask } from '@/lib/data/navigator'
import type { GriefSupportRequest } from '@/lib/data/grief'
import { MemberDetailPanel } from './MemberDetailPanel'

const SEVERITY_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  emergency: { bg: 'var(--color-emergency-bg)', text: 'var(--color-emergency-text)', border: 'var(--color-emergency-border)', label: 'Emergency' },
  urgent: { bg: 'var(--color-urgent-bg)', text: 'var(--color-urgent-text)', border: 'var(--color-urgent-border)', label: 'Urgent' },
  concern: { bg: 'var(--color-concern-bg)', text: 'var(--color-concern-text)', border: 'var(--color-concern-border)', label: 'Concern' },
  informational: { bg: 'var(--color-info-bg)', text: 'var(--color-info-text)', border: 'var(--color-info-border)', label: 'Info' },
}

const PRIORITY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'var(--color-emergency-bg)', text: 'var(--color-emergency-text)', label: 'Critical' },
  high: { bg: 'var(--color-urgent-bg)', text: 'var(--color-urgent-text)', label: 'High' },
  medium: { bg: 'var(--color-concern-bg)', text: 'var(--color-concern-text)', label: 'Medium' },
  low: { bg: 'var(--color-info-bg)', text: 'var(--color-info-text)', label: 'Low' },
}

const PRIORITY_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true })
  } catch {
    return '—'
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

export interface NavConsoleProps {
  navigatorName: string
  caseload: CaseloadEntry[]
  tasks: NavigatorTask[]
  membersById: Record<string, string>
  caseloadError: string | null
  tasksError: string | null
  griefRequests?: (GriefSupportRequest & { members: { preferred_name: string; full_name: string; phone_number: string } | null })[]
}

export function NavConsole({
  navigatorName,
  caseload,
  tasks,
  membersById,
  caseloadError,
  tasksError,
  griefRequests = [],
}: NavConsoleProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set())
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set())
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({})
  const [panelMemberId, setPanelMemberId] = useState<string | null>(null)
  const [panelMemberName, setPanelMemberName] = useState('')
  const panelTriggerRef = useRef<HTMLElement | null>(null)
  const [activeGriefReq, setActiveGriefReq] = useState<(typeof griefRequests)[0] | null>(null)
  const [griefNotes, setGriefNotes] = useState('')
  const [griefContacting, setGriefContacting] = useState(false)
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set())

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgedIds(prev => new Set([...prev, alertId]))
    try {
      const res = await fetch(`/api/navigator/alerts/${alertId}/acknowledge`, { method: 'POST' })
      if (!res.ok) {
        setAcknowledgedIds(prev => { const n = new Set(prev); n.delete(alertId); return n })
        setActionErrors(prev => ({ ...prev, [alertId]: 'Failed to acknowledge. Please try again.' }))
      }
    } catch {
      setAcknowledgedIds(prev => { const n = new Set(prev); n.delete(alertId); return n })
      setActionErrors(prev => ({ ...prev, [alertId]: 'Network error. Please try again.' }))
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    setCompletedTaskIds(prev => new Set([...prev, taskId]))
    try {
      const res = await fetch(`/api/navigator/tasks/${taskId}/complete`, { method: 'POST' })
      if (!res.ok) {
        setCompletedTaskIds(prev => { const n = new Set(prev); n.delete(taskId); return n })
        setActionErrors(prev => ({ ...prev, [taskId]: 'Failed to complete task. Please try again.' }))
      }
    } catch {
      setCompletedTaskIds(prev => { const n = new Set(prev); n.delete(taskId); return n })
      setActionErrors(prev => ({ ...prev, [taskId]: 'Network error. Please try again.' }))
    }
  }

  const handleMarkContacted = async () => {
    if (!activeGriefReq) return
    setGriefContacting(true)
    try {
      const res = await fetch(`/api/grief-support/${activeGriefReq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'navigator_notified', navigatorNotes: griefNotes || undefined }),
      })
      if (res.ok) {
        setContactedIds(prev => new Set([...prev, activeGriefReq.id]))
        setActiveGriefReq(null)
        setGriefNotes('')
      }
    } catch {
      // silently fail — navigator can retry
    } finally {
      setGriefContacting(false)
    }
  }

  // Alert queue: urgent + emergency unacknowledged alerts across all caseload
  const alertQueue = caseload
    .flatMap(entry =>
      entry.unacknowledgedAlerts
        .filter(a => (a.severity === 'urgent' || a.severity === 'emergency') && !acknowledgedIds.has(a.id))
        .map(a => ({ alert: a, memberName: entry.member.preferred_name }))
    )
    .sort((a, b) => {
      const sevA = a.alert.severity === 'emergency' ? 2 : 1
      const sevB = b.alert.severity === 'emergency' ? 2 : 1
      return sevB - sevA
    })

  // Filtered caseload
  const filteredCaseload = caseload.filter(entry =>
    entry.member.full_name.toLowerCase().includes(search.toLowerCase())
  )

  // Visible tasks sorted by priority
  const visibleTasks = tasks
    .filter(t => !completedTaskIds.has(t.id))
    .sort((a, b) => (PRIORITY_ORDER[b.priority] ?? 0) - (PRIORITY_ORDER[a.priority] ?? 0))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      {/* Sticky nav */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: 'var(--color-navy)',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="Navigator console navigation"
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                color: 'var(--color-cream)',
                fontWeight: 500,
              }}
            >
              ThriveAtHome
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'rgba(250,250,245,0.6)',
              }}
            >
              Navigator Console
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'rgba(250,250,245,0.8)',
              }}
            >
              {navigatorName}
            </span>
            <button
              onClick={handleSignOut}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'var(--color-cream)',
                background: 'transparent',
                border: '1px solid rgba(250,250,245,0.4)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 64px' }}>
        {/* Page heading */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 500,
            color: 'var(--color-navy)',
            marginBottom: '32px',
            letterSpacing: '-0.01em',
          }}
        >
          Your caseload
        </h1>

        {/* ── Alert Queue ─────────────────────────────── */}
        {alertQueue.length > 0 && (
          <section
            aria-label="Urgent alerts requiring acknowledgement"
            style={{ marginBottom: '40px' }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-urgent-text)',
                marginBottom: '12px',
              }}
            >
              Alerts requiring acknowledgement
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alertQueue.map(({ alert, memberName }) => {
                const style = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.urgent
                return (
                  <div
                    key={alert.id}
                    role="alert"
                    style={{
                      backgroundColor: style.bg,
                      border: `1px solid ${style.border}`,
                      borderLeft: `4px solid ${style.border}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '15px',
                            fontWeight: 600,
                            color: style.text,
                          }}
                        >
                          {memberName}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: style.text,
                            backgroundColor: style.border,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {style.label}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            color: style.text,
                            opacity: 0.75,
                          }}
                        >
                          {timeAgo(alert.created_at)}
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '14px',
                          color: style.text,
                          margin: 0,
                          opacity: 0.9,
                        }}
                      >
                        {alert.message}
                      </p>
                      {actionErrors[alert.id] && (
                        <p
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            color: 'var(--color-emergency-text)',
                            margin: 0,
                          }}
                        >
                          {actionErrors[alert.id]}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      aria-label={`Acknowledge alert for ${memberName}`}
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: style.text,
                        background: 'white',
                        border: `1px solid ${style.border}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 18px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        minHeight: '36px',
                      }}
                    >
                      Acknowledge
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Grief Support Queue ─────────────────────── */}
        {griefRequests.filter(r => !contactedIds.has(r.id)).length > 0 && (
          <section aria-label="Grief support requests" style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B21A8', marginBottom: '12px' }}>
              🕊️ Grief &amp; transition support — pending ({griefRequests.filter(r => !contactedIds.has(r.id)).length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {griefRequests.filter(r => !contactedIds.has(r.id)).map(req => {
                const memberDisplayName = req.members?.preferred_name ?? req.members?.full_name ?? 'Unknown member'
                const date = new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const lossLabel: Record<string, string> = {
                  loss_of_loved_one: '🕊️ Loss of a loved one',
                  major_health_diagnosis: '🏥 Major health diagnosis',
                  major_life_change: '🌱 Major life change',
                  loss_of_independence: '🤝 Caregiver support',
                }
                const isActive = activeGriefReq?.id === req.id
                return (
                  <div key={req.id} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: isActive ? '2px solid #7C3AED' : '1px solid #E9D5FF' }}>
                    <div
                      style={{ backgroundColor: '#FDF4FF', borderLeft: '4px solid #7C3AED', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: '#4C1D95' }}>{memberDisplayName}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, backgroundColor: '#DDD6FE', color: '#5B21B6', padding: '2px 8px', borderRadius: '20px' }}>Pending</span>
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>Submitted {date}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#4C1D95' }}>{lossLabel[req.loss_type] ?? req.loss_type}</div>
                        {req.circle_type_requested && (
                          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>Requested: {req.circle_type_requested}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isActive) { setActiveGriefReq(null); setGriefNotes('') }
                          else { setActiveGriefReq(req); setGriefNotes('') }
                        }}
                        style={{ padding: '7px 14px', borderRadius: '6px', backgroundColor: isActive ? '#5B21B6' : '#7C3AED', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {isActive ? 'Close ×' : 'Contact member'}
                      </button>
                    </div>

                    {/* Outreach action panel */}
                    {isActive && (
                      <div style={{ backgroundColor: 'white', borderTop: '1px solid #E9D5FF', padding: '20px 22px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: '3px' }}>Member</div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#4C1D95' }}>{memberDisplayName}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: '3px' }}>Phone</div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937' }}>
                              {req.members?.phone_number
                                ? <a href={`tel:${req.members.phone_number}`} style={{ color: '#7C3AED', textDecoration: 'none' }}>{req.members.phone_number}</a>
                                : <span style={{ color: '#9CA3AF' }}>—</span>}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: '3px' }}>Support type</div>
                            <div style={{ fontSize: '14px', color: '#4C1D95' }}>{lossLabel[req.loss_type] ?? req.loss_type}</div>
                          </div>
                          {req.circle_type_requested && (
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: '3px' }}>Requested</div>
                              <div style={{ fontSize: '14px', color: '#6B7280' }}>{req.circle_type_requested}</div>
                            </div>
                          )}
                          {req.availability_preference && (
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: '3px' }}>Best time</div>
                              <div style={{ fontSize: '14px', color: '#6B7280' }}>{req.availability_preference}</div>
                            </div>
                          )}
                        </div>

                        {req.additional_notes && (
                          <div style={{ backgroundColor: '#F5F3FF', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: '4px' }}>Member notes</div>
                            <div style={{ fontSize: '14px', color: '#4C1D95', lineHeight: 1.5 }}>{req.additional_notes}</div>
                          </div>
                        )}

                        <div style={{ marginBottom: '14px' }}>
                          <label htmlFor={`grief-notes-${req.id}`} style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                            Outreach notes (logged to member record)
                          </label>
                          <textarea
                            id={`grief-notes-${req.id}`}
                            value={griefNotes}
                            onChange={e => setGriefNotes(e.target.value)}
                            placeholder="e.g. Called at 2pm — left voicemail. Will follow up Thursday."
                            rows={3}
                            style={{ width: '100%', border: '1.5px solid #E9D5FF', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                          />
                        </div>

                        <button
                          type="button"
                          disabled={griefContacting}
                          onClick={handleMarkContacted}
                          style={{ padding: '9px 20px', borderRadius: '8px', backgroundColor: griefContacting ? '#9CA3AF' : '#7C3AED', color: 'white', border: 'none', fontSize: '14px', fontWeight: 700, cursor: griefContacting ? 'not-allowed' : 'pointer' }}
                        >
                          {griefContacting ? 'Saving…' : '✓ Mark as contacted'}
                        </button>
                        <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '12px' }}>Updates status to &quot;navigator notified&quot;</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Caseload Table ──────────────────────────── */}
        <section aria-label="Caseload" style={{ marginBottom: '48px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 500,
                color: 'var(--color-navy)',
              }}
            >
              Members ({caseload.length})
            </h2>
            <div style={{ position: 'relative' }}>
              <label htmlFor="member-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
                Search members
              </label>
              <input
                id="member-search"
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name…"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'white',
                  border: '1.5px solid var(--color-warm-grey)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0 14px',
                  height: '44px',
                  width: '240px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {caseloadError ? (
            <div
              style={{
                backgroundColor: 'var(--color-concern-bg)',
                border: '1px solid var(--color-concern-border)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 24px',
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'var(--color-concern-text)',
              }}
            >
              Could not load caseload data. Please refresh to try again.
            </div>
          ) : filteredCaseload.length === 0 ? (
            <div
              style={{
                backgroundColor: 'white',
                border: '1px solid var(--color-warm-grey)',
                borderRadius: 'var(--radius-md)',
                padding: '48px 24px',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                color: 'var(--color-text-secondary)',
              }}
            >
              {search ? `No members match "${search}"` : 'No members assigned yet.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  backgroundColor: 'white',
                }}
                aria-label="Caseload table"
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'var(--color-navy)',
                      color: 'var(--color-cream)',
                      textAlign: 'left',
                    }}
                  >
                    {['Name', 'Plan', 'Last check-in', 'Status', 'Mood', ''].map(col => (
                      <th
                        key={col}
                        scope="col"
                        style={{
                          padding: '12px 16px',
                          fontWeight: 600,
                          fontSize: '12px',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCaseload.map((entry, idx) => {
                    const sev = entry.worstSeverity
                    const style = sev ? SEVERITY_STYLE[sev] : null
                    return (
                      <tr
                        key={entry.member.id}
                        style={{
                          backgroundColor: idx % 2 === 0 ? 'white' : 'var(--color-warm-white)',
                          borderBottom: '1px solid var(--color-warm-grey)',
                        }}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          {entry.member.preferred_name || entry.member.full_name}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                          {entry.member.plan_tier}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          {entry.latestCall?.ended_at
                            ? formatDate(entry.latestCall.ended_at)
                            : entry.latestCall?.created_at
                            ? formatDate(entry.latestCall.created_at)
                            : '—'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {style ? (
                            <span
                              style={{
                                display: 'inline-block',
                                backgroundColor: style.bg,
                                color: style.text,
                                border: `1px solid ${style.border}`,
                                borderRadius: 'var(--radius-full)',
                                padding: '2px 10px',
                                fontSize: '12px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              {style.label}
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-block',
                                backgroundColor: 'var(--color-teal-muted)',
                                color: 'var(--color-teal)',
                                borderRadius: 'var(--radius-full)',
                                padding: '2px 10px',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              All good
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)' }}>
                          {moodLabel(entry.latestCall?.mood_score ?? null)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={(e) => {
                              panelTriggerRef.current = e.currentTarget
                              setPanelMemberName(entry.member.preferred_name || entry.member.full_name)
                              setPanelMemberId(entry.member.id)
                            }}
                            aria-label={`View details for ${entry.member.preferred_name || entry.member.full_name}`}
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '13px',
                              fontWeight: 500,
                              color: 'var(--color-teal)',
                              background: 'transparent',
                              border: '1.5px solid var(--color-teal)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '6px 14px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              minHeight: '34px',
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Today's Tasks ───────────────────────────── */}
        <section aria-label="Today's tasks">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: 500,
              color: 'var(--color-navy)',
              marginBottom: '16px',
            }}
          >
            Today&apos;s tasks
          </h2>

          {tasksError ? (
            <div
              style={{
                backgroundColor: 'var(--color-concern-bg)',
                border: '1px solid var(--color-concern-border)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 24px',
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'var(--color-concern-text)',
              }}
            >
              Could not load tasks. Please refresh to try again.
            </div>
          ) : visibleTasks.length === 0 ? (
            <div
              style={{
                backgroundColor: 'white',
                border: '1px solid var(--color-warm-grey)',
                borderRadius: 'var(--radius-md)',
                padding: '48px 24px',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                color: 'var(--color-text-secondary)',
              }}
            >
              No open tasks today. ✓
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visibleTasks.map(task => {
                const ps = PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.low
                const memberName = task.member_id ? (membersById[task.member_id] ?? 'Unknown member') : '—'
                return (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid var(--color-warm-grey)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: ps.text,
                            backgroundColor: ps.bg,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {ps.label}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--color-navy)',
                          }}
                        >
                          {memberName}
                        </span>
                        {task.due_by && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '12px',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            Due {formatDate(task.due_by)}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '14px',
                          color: 'var(--color-text-primary)',
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {task.description}
                      </p>
                      {actionErrors[task.id] && (
                        <p
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            color: 'var(--color-emergency-text)',
                            margin: '6px 0 0',
                          }}
                        >
                          {actionErrors[task.id]}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      aria-label={`Mark task for ${memberName} as complete`}
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--color-teal)',
                        background: 'white',
                        border: '1.5px solid var(--color-teal)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        minHeight: '36px',
                      }}
                    >
                      Mark complete
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {panelMemberId && (
        <MemberDetailPanel
          memberId={panelMemberId}
          memberName={panelMemberName}
          triggerRef={panelTriggerRef}
          onClose={() => setPanelMemberId(null)}
        />
      )}
    </div>
  )
}
