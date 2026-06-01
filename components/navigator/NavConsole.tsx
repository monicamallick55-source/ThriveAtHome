'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import type { CaseloadEntry, NavigatorTask } from '@/lib/data/navigator'
import type { GriefSupportRequest } from '@/lib/data/grief'
import type { ServiceBooking } from '@/lib/data/services'
import { MemberDetailPanel } from './MemberDetailPanel'

type PendingBooking = ServiceBooking & { member_name: string; member_phone: string }

const SEVERITY_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  emergency: { bg: 'var(--color-emergency-bg)', text: 'var(--color-emergency-text)', border: 'var(--color-emergency-border)', label: 'Emergency' },
  urgent: { bg: 'var(--color-urgent-bg)', text: 'var(--color-urgent-text)', border: 'var(--color-urgent-border)', label: 'Urgent' },
  concern: { bg: 'var(--color-concern-bg)', text: 'var(--color-concern-text)', border: 'var(--color-concern-border)', label: 'Concern' },
  informational: { bg: 'var(--color-info-bg)', text: 'var(--color-info-text)', border: 'var(--color-info-border)', label: 'Info' },
}

const PRIORITY_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

function timeAgo(iso: string): string {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }) } catch { return '—' }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return '—' }
}

function moodLabel(score: number | null): string {
  if (score === null) return '—'
  if (score >= 8) return `😊 ${score}/10`
  if (score >= 6) return `🙂 ${score}/10`
  if (score >= 4) return `😐 ${score}/10`
  return `😔 ${score}/10`
}

const SERVICE_EMOJIS: Record<string, string> = {
  transport: '🚗', home_service: '🏠', meals: '🥗',
  telehealth: '🏥', legal_financial: '⚖️', tech_help: '💻', companion: '🤝',
}
const SERVICE_LABELS: Record<string, string> = {
  transport: 'Transport', home_service: 'Home Services', meals: 'Meals',
  telehealth: 'Health Services', legal_financial: 'Legal & Financial', tech_help: 'Tech Help', companion: 'Companion',
}

const LOSS_LABELS: Record<string, string> = {
  loss_of_loved_one: '🕊️ Loss of loved one',
  major_health_diagnosis: '🏥 Major health diagnosis',
  major_life_change: '🌱 Major life change',
  loss_of_independence: '🤝 Caregiver support',
  moving_to_care_setting: '🏠 Moving to care setting',
}

type ActionItem =
  | { kind: 'alert'; id: string; memberName: string; memberId: string; severity: string; message: string; createdAt: string; urgency: number }
  | { kind: 'grief'; id: string; memberName: string; memberId: string; lossType: string; createdAt: string; urgency: number }
  | { kind: 'service'; id: string; memberName: string; memberId: string; serviceType: string; createdAt: string; urgency: number }
  | { kind: 'task'; id: string; memberName: string; memberId: string | null; priority: string; description: string; dueBy: string | null; urgency: number }

type FilterType = 'all' | 'alerts' | 'service' | 'grief' | 'tasks'

export interface NavConsoleProps {
  navigatorName: string
  caseload: CaseloadEntry[]
  tasks: NavigatorTask[]
  membersById: Record<string, string>
  caseloadError: string | null
  tasksError: string | null
  griefRequests?: (GriefSupportRequest & { members: { preferred_name: string; full_name: string; phone_number: string } | null })[]
  pendingBookings?: PendingBooking[]
}

export function NavConsole({
  navigatorName,
  caseload,
  tasks,
  membersById,
  caseloadError,
  tasksError,
  griefRequests = [],
  pendingBookings = [],
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
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [tableExpanded, setTableExpanded] = useState(false)
  const actionFeedRef = useRef<HTMLElement | null>(null)

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
        setActionErrors(prev => ({ ...prev, [alertId]: 'Failed to acknowledge.' }))
      }
    } catch {
      setAcknowledgedIds(prev => { const n = new Set(prev); n.delete(alertId); return n })
      setActionErrors(prev => ({ ...prev, [alertId]: 'Network error.' }))
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    setCompletedTaskIds(prev => new Set([...prev, taskId]))
    try {
      const res = await fetch(`/api/navigator/tasks/${taskId}/complete`, { method: 'POST' })
      if (!res.ok) {
        setCompletedTaskIds(prev => { const n = new Set(prev); n.delete(taskId); return n })
        setActionErrors(prev => ({ ...prev, [taskId]: 'Failed to complete task.' }))
      }
    } catch {
      setCompletedTaskIds(prev => { const n = new Set(prev); n.delete(taskId); return n })
      setActionErrors(prev => ({ ...prev, [taskId]: 'Network error.' }))
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

  // Build unified action feed
  const alertItems: ActionItem[] = caseload.flatMap(entry =>
    entry.unacknowledgedAlerts
      .filter(a => !acknowledgedIds.has(a.id))
      .map(a => ({
        kind: 'alert' as const,
        id: a.id,
        memberName: entry.member.preferred_name || entry.member.full_name,
        memberId: entry.member.id,
        severity: a.severity,
        message: a.message,
        createdAt: a.created_at,
        urgency: a.severity === 'emergency' ? 10 : a.severity === 'urgent' ? 8 : a.severity === 'concern' ? 3 : 1,
      }))
  )

  const griefItems: ActionItem[] = griefRequests
    .filter(r => !contactedIds.has(r.id))
    .map(r => ({
      kind: 'grief' as const,
      id: r.id,
      memberName: r.members?.preferred_name ?? r.members?.full_name ?? 'Unknown',
      memberId: r.member_id,
      lossType: r.loss_type,
      createdAt: r.created_at,
      urgency: 7,
    }))

  const serviceItems: ActionItem[] = pendingBookings.map(b => ({
    kind: 'service' as const,
    id: b.id,
    memberName: b.member_name,
    memberId: b.member_id,
    serviceType: b.service_type,
    createdAt: b.created_at,
    urgency: 6,
  }))

  const taskItems: ActionItem[] = tasks
    .filter(t => !completedTaskIds.has(t.id))
    .map(t => ({
      kind: 'task' as const,
      id: t.id,
      memberName: t.member_id ? (membersById[t.member_id] ?? 'Unknown') : '—',
      memberId: t.member_id ?? null,
      priority: t.priority,
      description: t.description,
      dueBy: t.due_by ?? null,
      urgency: PRIORITY_ORDER[t.priority] ?? 1,
    }))

  const allActionItems: ActionItem[] = [...alertItems, ...griefItems, ...serviceItems, ...taskItems]
    .sort((a, b) => b.urgency - a.urgency)

  const filteredActions = allActionItems.filter(item => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'alerts') return item.kind === 'alert'
    if (activeFilter === 'grief') return item.kind === 'grief'
    if (activeFilter === 'service') return item.kind === 'service'
    if (activeFilter === 'tasks') return item.kind === 'task'
    return true
  })

  // Stats for header cards
  const alertCount = alertItems.length
  const serviceCount = serviceItems.length
  const griefCount = griefItems.length
  const taskCount = taskItems.length

  const handleStatCardClick = (filter: FilterType) => {
    setActiveFilter(filter === activeFilter ? 'all' : filter)
    setTimeout(() => actionFeedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  // Caseload: build open items summary
  const filteredCaseload = caseload.filter(entry =>
    entry.member.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      {/* Sticky nav */}
      <nav
        style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'var(--color-navy)', height: '64px', display: 'flex', alignItems: 'center' }}
        aria-label="Navigator console navigation"
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(250,250,245,0.6)' }}>Navigator Console</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(250,250,245,0.8)' }}>{navigatorName}</span>
            <button
              onClick={handleSignOut}
              style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-cream)', background: 'transparent', border: '1px solid rgba(250,250,245,0.4)', borderRadius: 'var(--radius-sm)', padding: '6px 14px', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 64px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '28px', letterSpacing: '-0.01em' }}>
          Your caseload
        </h1>

        {/* ── Header summary bar ─────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '36px',
          }}
          role="region"
          aria-label="Action summary"
        >
          <StatCard
            label="Alerts needing action"
            count={alertCount}
            active={activeFilter === 'alerts'}
            onClick={() => handleStatCardClick('alerts')}
            accentColor={alertCount > 0 ? 'var(--color-emergency-border)' : 'var(--color-warm-grey)'}
            textColor={alertCount > 0 ? 'var(--color-emergency-text)' : 'var(--color-text-secondary)'}
          />
          <StatCard
            label="Service requests pending"
            count={serviceCount}
            active={activeFilter === 'service'}
            onClick={() => handleStatCardClick('service')}
            accentColor={serviceCount > 0 ? 'var(--color-teal)' : 'var(--color-warm-grey)'}
            textColor={serviceCount > 0 ? 'var(--color-teal)' : 'var(--color-text-secondary)'}
          />
          <StatCard
            label="Grief support requests"
            count={griefCount}
            active={activeFilter === 'grief'}
            onClick={() => handleStatCardClick('grief')}
            accentColor={griefCount > 0 ? '#7C3AED' : 'var(--color-warm-grey)'}
            textColor={griefCount > 0 ? '#7C3AED' : 'var(--color-text-secondary)'}
          />
          <StatCard
            label="Open tasks"
            count={taskCount}
            active={activeFilter === 'tasks'}
            onClick={() => handleStatCardClick('tasks')}
            accentColor={taskCount > 0 ? 'var(--color-urgent-border)' : 'var(--color-warm-grey)'}
            textColor={taskCount > 0 ? 'var(--color-urgent-text)' : 'var(--color-text-secondary)'}
          />
        </div>

        {/* ── Unified Action Feed ─────────────────────── */}
        <section
          aria-label="Action feed"
          ref={el => { actionFeedRef.current = el }}
          style={{ marginBottom: '48px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)' }}>
              {activeFilter === 'all' ? 'All action items' :
               activeFilter === 'alerts' ? 'Alerts' :
               activeFilter === 'service' ? 'Service requests' :
               activeFilter === 'grief' ? 'Grief & transition support' :
               'Tasks'}
              {' '}
              <span style={{ fontSize: '18px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                ({filteredActions.length})
              </span>
            </h2>
            {activeFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-teal)', background: 'transparent', border: '1.5px solid var(--color-teal)', borderRadius: 'var(--radius-sm)', padding: '5px 14px', cursor: 'pointer' }}
              >
                Show all
              </button>
            )}
          </div>

          {filteredActions.length === 0 ? (
            <div style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)' }}>
              {activeFilter === 'all' ? '✓ No pending action items across your caseload.' : `No ${activeFilter} items.`}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredActions.map(item => {
                if (item.kind === 'alert') {
                  const s = SEVERITY_STYLE[item.severity] ?? SEVERITY_STYLE.urgent
                  return (
                    <div
                      key={`alert-${item.id}`}
                      role="alert"
                      style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, borderLeft: `4px solid ${s.border}`, borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, color: s.text }}>{item.memberName}</span>
                          <Badge label="ALERT" bg={s.border} text={s.text} />
                          <Badge label={s.label.toUpperCase()} bg={s.border} text={s.text} />
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: s.text, opacity: 0.7 }}>{timeAgo(item.createdAt)}</span>
                        </div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: s.text, margin: 0, opacity: 0.9, lineHeight: 1.5 }}>{item.message}</p>
                        {actionErrors[item.id] && <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-emergency-text)', margin: '4px 0 0' }}>{actionErrors[item.id]}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          onClick={() => { panelTriggerRef.current = null; setPanelMemberName(item.memberName); setPanelMemberId(item.memberId) }}
                          style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: s.text, background: 'white', border: `1px solid ${s.border}`, borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: 'pointer' }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleAcknowledge(item.id)}
                          style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: s.text, background: 'white', border: `1px solid ${s.border}`, borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: 'pointer' }}
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  )
                }

                if (item.kind === 'grief') {
                  const req = griefRequests.find(r => r.id === item.id)
                  const isActive = activeGriefReq?.id === item.id
                  return (
                    <div key={`grief-${item.id}`} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: isActive ? '2px solid #7C3AED' : '1px solid #E9D5FF' }}>
                      <div style={{ backgroundColor: '#FDF4FF', borderLeft: '4px solid #7C3AED', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, color: '#4C1D95' }}>{item.memberName}</span>
                            <Badge label="GRIEF SUPPORT" bg="#7C3AED" text="white" />
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#7C3AED', opacity: 0.7 }}>{timeAgo(item.createdAt)}</span>
                          </div>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#5B21B6', margin: 0 }}>{LOSS_LABELS[item.lossType] ?? item.lossType}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button
                            onClick={() => { panelTriggerRef.current = null; setPanelMemberName(item.memberName); setPanelMemberId(item.memberId) }}
                            style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#7C3AED', background: 'white', border: '1px solid #7C3AED', borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: 'pointer' }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => { if (isActive) { setActiveGriefReq(null); setGriefNotes('') } else if (req) { setActiveGriefReq(req); setGriefNotes('') } }}
                            style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'white', background: isActive ? '#5B21B6' : '#7C3AED', border: 'none', borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: 'pointer' }}
                          >
                            {isActive ? 'Close ×' : 'Contact member'}
                          </button>
                        </div>
                      </div>

                      {isActive && req && (
                        <div style={{ backgroundColor: 'white', borderTop: '1px solid #E9D5FF', padding: '18px 20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                            <DetailMini label="Phone">
                              {req.members?.phone_number
                                ? <a href={`tel:${req.members.phone_number}`} style={{ color: '#7C3AED', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>{req.members.phone_number}</a>
                                : <span style={{ color: '#9CA3AF' }}>—</span>}
                            </DetailMini>
                            <DetailMini label="Support type"><span style={{ fontSize: '14px', color: '#4C1D95' }}>{LOSS_LABELS[req.loss_type] ?? req.loss_type}</span></DetailMini>
                            {req.circle_type_requested && <DetailMini label="Requested"><span style={{ fontSize: '14px', color: '#6B7280' }}>{req.circle_type_requested}</span></DetailMini>}
                            {req.availability_preference && <DetailMini label="Best time"><span style={{ fontSize: '14px', color: '#6B7280' }}>{req.availability_preference}</span></DetailMini>}
                          </div>
                          {(req as GriefSupportRequest & { additional_notes?: string }).additional_notes && (
                            <div style={{ backgroundColor: '#F5F3FF', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '14px', color: '#4C1D95', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                              {(req as GriefSupportRequest & { additional_notes?: string }).additional_notes}
                            </div>
                          )}
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '5px', fontFamily: 'var(--font-body)' }}>Outreach notes</label>
                            <textarea
                              value={griefNotes}
                              onChange={e => setGriefNotes(e.target.value)}
                              placeholder="e.g. Called at 2pm — left voicemail."
                              rows={2}
                              style={{ width: '100%', border: '1.5px solid #E9D5FF', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            />
                          </div>
                          <button
                            type="button"
                            disabled={griefContacting}
                            onClick={handleMarkContacted}
                            style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: griefContacting ? '#9CA3AF' : '#7C3AED', color: 'white', border: 'none', fontSize: '13px', fontWeight: 700, cursor: griefContacting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' }}
                          >
                            {griefContacting ? 'Saving…' : '✓ Mark as contacted'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                }

                if (item.kind === 'service') {
                  return (
                    <div
                      key={`service-${item.id}`}
                      style={{ backgroundColor: 'var(--color-teal-muted)', border: '1px solid rgba(26,122,106,0.25)', borderLeft: '4px solid var(--color-teal)', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, color: 'var(--color-teal)' }}>{item.memberName}</span>
                          <Badge label="SERVICE REQUEST" bg="var(--color-teal)" text="white" />
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-teal)', opacity: 0.7 }}>{timeAgo(item.createdAt)}</span>
                        </div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', margin: 0 }}>
                          {SERVICE_EMOJIS[item.serviceType]} {SERVICE_LABELS[item.serviceType] ?? item.serviceType} request
                        </p>
                      </div>
                      <button
                        onClick={() => { panelTriggerRef.current = null; setPanelMemberName(item.memberName); setPanelMemberId(item.memberId) }}
                        style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-teal)', background: 'white', border: '1.5px solid var(--color-teal)', borderRadius: 'var(--radius-sm)', padding: '6px 14px', cursor: 'pointer', flexShrink: 0 }}
                      >
                        View member →
                      </button>
                    </div>
                  )
                }

                if (item.kind === 'task') {
                  const priorityColors: Record<string, { bg: string; text: string }> = {
                    critical: { bg: 'var(--color-emergency-bg)', text: 'var(--color-emergency-text)' },
                    high: { bg: 'var(--color-urgent-bg)', text: 'var(--color-urgent-text)' },
                    medium: { bg: 'var(--color-concern-bg)', text: 'var(--color-concern-text)' },
                    low: { bg: '#f9fafb', text: '#6b7280' },
                  }
                  const pc = priorityColors[item.priority] ?? priorityColors.low
                  return (
                    <div
                      key={`task-${item.id}`}
                      style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderLeft: `4px solid ${item.priority === 'critical' ? 'var(--color-emergency-border)' : item.priority === 'high' ? 'var(--color-urgent-border)' : '#e5e7eb'}`, borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)' }}>{item.memberName}</span>
                          <Badge label="TASK" bg="#e5e7eb" text="#374151" />
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700, color: pc.text, backgroundColor: pc.bg, borderRadius: '20px', padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {item.priority}
                          </span>
                          {item.dueBy && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>Due {formatDate(item.dueBy)}</span>}
                        </div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.5 }}>{item.description}</p>
                        {actionErrors[item.id] && <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-emergency-text)', margin: '4px 0 0' }}>{actionErrors[item.id]}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        {item.memberId && (
                          <button
                            onClick={() => { panelTriggerRef.current = null; setPanelMemberName(item.memberName); setPanelMemberId(item.memberId!) }}
                            style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-teal)', background: 'white', border: '1.5px solid var(--color-teal)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: 'pointer' }}
                          >
                            View
                          </button>
                        )}
                        <button
                          onClick={() => handleCompleteTask(item.id)}
                          style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-teal)', background: 'white', border: '1.5px solid var(--color-teal)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: 'pointer' }}
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  )
                }

                return null
              })}
            </div>
          )}
        </section>

        {/* ── Caseload Table — collapsed by default ───── */}
        <section aria-label="Caseload" style={{ marginBottom: '48px' }}>
          <button
            type="button"
            onClick={() => setTableExpanded(e => !e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              marginBottom: tableExpanded ? '16px' : '0',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
              Caseload ({caseload.length} members) {tableExpanded ? '▲' : '▼'}
            </h2>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {tableExpanded ? 'Collapse' : 'Expand to browse'}
            </span>
          </button>

          {tableExpanded && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <input
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name…"
                  aria-label="Search members"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-primary)', backgroundColor: 'white', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '0 14px', height: '44px', width: '240px', outline: 'none' }}
                />
              </div>

              {caseloadError ? (
                <div style={{ backgroundColor: 'var(--color-concern-bg)', border: '1px solid var(--color-concern-border)', borderRadius: 'var(--radius-md)', padding: '20px 24px', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-concern-text)' }}>
                  Could not load caseload data. Please refresh.
                </div>
              ) : filteredCaseload.length === 0 ? (
                <div style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)' }}>
                  {search ? `No members match "${search}"` : 'No members assigned yet.'}
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '14px', backgroundColor: 'white' }} aria-label="Caseload table">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-navy)', color: 'var(--color-cream)', textAlign: 'left' }}>
                        {['Name', 'Plan', 'Last check-in', 'Mood', 'Open items', ''].map(col => (
                          <th key={col} scope="col" style={{ padding: '12px 16px', fontWeight: 600, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCaseload.map((entry, idx) => {
                        const alertsCount = entry.unacknowledgedAlerts.filter(a => !acknowledgedIds.has(a.id)).length
                        const serviceReqCount = pendingBookings.filter(b => b.member_id === entry.member.id).length
                        const openItemsLabel = [
                          alertsCount > 0 ? `${alertsCount} alert${alertsCount > 1 ? 's' : ''}` : '',
                          serviceReqCount > 0 ? `${serviceReqCount} service req` : '',
                        ].filter(Boolean).join(', ') || '—'

                        return (
                          <tr key={entry.member.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : 'var(--color-warm-white)', borderBottom: '1px solid var(--color-warm-grey)' }}>
                            <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{entry.member.preferred_name || entry.member.full_name}</td>
                            <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{entry.member.plan_tier}</td>
                            <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                              {entry.latestCall?.ended_at ? formatDate(entry.latestCall.ended_at) : entry.latestCall?.created_at ? formatDate(entry.latestCall.created_at) : '—'}
                            </td>
                            <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)' }}>{moodLabel(entry.latestCall?.mood_score ?? null)}</td>
                            <td style={{ padding: '14px 16px', color: alertsCount > 0 ? 'var(--color-urgent-text)' : 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: '13px' }}>{openItemsLabel}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <button
                                onClick={(e) => { panelTriggerRef.current = e.currentTarget; setPanelMemberName(entry.member.preferred_name || entry.member.full_name); setPanelMemberId(entry.member.id) }}
                                aria-label={`View details for ${entry.member.preferred_name || entry.member.full_name}`}
                                style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--color-teal)', background: 'transparent', border: '1.5px solid var(--color-teal)', borderRadius: 'var(--radius-sm)', padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap', minHeight: '34px' }}
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
            </>
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

function StatCard({
  label, count, active, onClick, accentColor, textColor
}: {
  label: string; count: number; active: boolean; onClick: () => void; accentColor: string; textColor: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        backgroundColor: active ? accentColor : 'white',
        border: `2px solid ${active ? accentColor : 'var(--color-warm-grey)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        textAlign: 'left',
        cursor: 'pointer',
        boxShadow: active ? '0 2px 8px rgba(0,0,0,0.12)' : 'var(--shadow-sm)',
        transition: 'all 0.15s',
      }}
      aria-pressed={active}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 600, color: active ? 'white' : textColor, lineHeight: 1, marginBottom: '6px' }}>
        {count}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: active ? 'rgba(255,255,255,0.85)' : 'var(--color-text-secondary)', lineHeight: 1.3 }}>
        {label}
      </div>
    </button>
  )
}

function Badge({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, color: text, backgroundColor: bg, padding: '2px 7px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </span>
  )
}

function DetailMini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: '2px', fontFamily: 'var(--font-body)' }}>{label}</div>
      {children}
    </div>
  )
}
