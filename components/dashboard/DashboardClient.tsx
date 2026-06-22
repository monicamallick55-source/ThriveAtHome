'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { SectionError } from './SectionError'
import { DashNav } from './DashNav'
import { WellnessCard } from './WellnessCard'
import { AlertsPanel } from './AlertsPanel'
import { MoodChart } from './MoodChart'
import { RecentCallsList } from './RecentCallsList'
import { TasksPanel } from './TasksPanel'
import { useNotifications } from '@/lib/realtime/useNotifications'
import type { Member } from '@/lib/data/members'
import type { CheckInCall } from '@/lib/data/calls'
import type { Alert } from '@/lib/data/alerts'
import type { RealtimeNotification } from '@/lib/data/notifications'
import type { FamilyTaskItem } from '@/lib/data/tasks'
import type { CelebrationEvent } from '@/lib/data/celebrations'
import type { ServiceBooking } from '@/lib/data/services'
import type { TrackedItem } from '@/lib/data/tracked-items-types'
import { ITEM_TYPE_DEFAULTS } from '@/lib/data/tracked-items-types'

const SERVICE_EMOJIS: Record<string, string> = {
  transport: '🚗',
  home_service: '🏠',
  meals: '🥗',
  telehealth: '🏥',
  legal_financial: '⚖️',
  tech_help: '💻',
  companion: '🤝',
}

const SERVICE_LABELS: Record<string, string> = {
  transport: 'Transport',
  home_service: 'Home Services',
  meals: 'Meals & Nutrition',
  telehealth: 'Health Services',
  legal_financial: 'Legal & Financial',
  tech_help: 'Tech Help',
  companion: 'Companion',
}

function statusBadge(status: string): { color: string; bg: string; label: string } {
  if (status === 'confirmed') return { color: '#1d4ed8', bg: '#dbeafe', label: 'Confirmed' }
  if (status === 'in_progress') return { color: '#92400e', bg: '#fef3c7', label: 'In progress' }
  if (status === 'completed') return { color: '#065f46', bg: '#d1fae5', label: 'Completed' }
  if (status === 'cancelled') return { color: '#6b7280', bg: '#f3f4f6', label: 'Cancelled' }
  return { color: '#c2410c', bg: '#fff3e0', label: 'Requested' }
}

function warmServiceMessage(b: ServiceBooking): string {
  const details = (b.booking_details ?? {}) as Record<string, string | undefined>
  const assignedName = details.assigned_volunteer || details.assigned_provider || null
  const scheduledTime = details.scheduled_time || b.requested_for
  const timeStr = scheduledTime
    ? new Date(scheduledTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
    : null
  const label = SERVICE_LABELS[b.service_type] ?? b.service_type

  if (b.status === 'confirmed' && assignedName) {
    const lastName = assignedName.trim().split(' ')
    const privateName = lastName.length > 1
      ? `${lastName[0]} ${lastName[lastName.length - 1][0]}.`
      : lastName[0]
    return `Your volunteer ${privateName} will assist with your ${label.toLowerCase()}${timeStr ? ` on ${timeStr}` : ''}.`
  }
  if (b.status === 'confirmed') {
    return `Your ${label.toLowerCase()} has been confirmed${timeStr ? ` for ${timeStr}` : ''}. Your navigator will be in touch with details.`
  }
  return `We are arranging your ${label.toLowerCase()}${timeStr ? ` for ${timeStr}` : ''}. Your navigator will confirm shortly.`
}

function ServiceBookingCard({ b }: { b: ServiceBooking }) {
  const [expanded, setExpanded] = useState(false)
  const details = (b.booking_details ?? {}) as Record<string, string | undefined>
  const badge = statusBadge(b.status)
  const isActive = b.status !== 'completed' && b.status !== 'cancelled'

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
      {/* Summary row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px' }}>
        <span style={{ fontSize: '24px', flexShrink: 0 }} aria-hidden="true">{SERVICE_EMOJIS[b.service_type] ?? '📋'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
            {SERVICE_LABELS[b.service_type] ?? b.service_type}
          </p>
          {isActive && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '3px 0 0', lineHeight: 1.4 }}>
              {warmServiceMessage(b)}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: badge.color, backgroundColor: badge.bg, borderRadius: '20px', padding: '3px 10px' }}>
            {badge.label}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(p => !p)}
            style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-teal)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}
          >
            {expanded ? 'Hide details ▲' : 'View details ▼'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-warm-grey)', padding: '14px 20px', backgroundColor: '#fafaf8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {b.requested_for && (
            <DetailRow label="Requested for" value={new Date(b.requested_for).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })} />
          )}
          {details.scheduled_time && (
            <DetailRow label="Scheduled" value={new Date(details.scheduled_time).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })} />
          )}
          {details.pickup_address && <DetailRow label="Pickup" value={details.pickup_address} />}
          {details.destination && <DetailRow label="Destination" value={details.destination} />}
          {details.description && <DetailRow label="Details" value={details.description} />}
          {details.health_subtype && <DetailRow label="Service type" value={details.health_subtype} />}
          {details.arrangement && <DetailRow label="Arrangement" value={details.arrangement} />}
          {details.assigned_volunteer && (() => {
            const av = details.assigned_volunteer
            const parts = av.trim().split(' ')
            const privateName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]
            return <DetailRow label="Assigned volunteer" value={privateName} />
          })()}
          {details.assigned_provider && <DetailRow label="Assigned provider" value={details.assigned_provider} />}
          {b.notes && <DetailRow label="Navigator note" value={b.notes} />}
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px', fontFamily: 'var(--font-body)', fontSize: '13px' }}>
      <span style={{ color: 'var(--color-text-secondary)', minWidth: '130px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function ScheduledServicesSection({ bookings, history }: { bookings: ServiceBooking[]; history: ServiceBooking[] }) {
  if (bookings.length === 0 && history.length === 0) return null
  return (
    <section aria-labelledby="services-heading">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 id="services-heading" style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
          Services
        </h2>
        <Link href="/dashboard/services" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', textDecoration: 'none', fontWeight: 500 }}>
          View all →
        </Link>
      </div>
      {bookings.length > 0 && (
        <>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
            Scheduled
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: history.length > 0 ? '20px' : 0 }}>
            {bookings.slice(0, 3).map((b) => (
              <ServiceBookingCard key={b.id} b={b} />
            ))}
          </div>
        </>
      )}
      {history.length > 0 && (
        <>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
            Recent history
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.map((b) => (
              <ServiceBookingCard key={b.id} b={b} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <Link href="/dashboard/services" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-teal)', textDecoration: 'none' }}>
              View full service history →
            </Link>
          </div>
        </>
      )}
    </section>
  )
}

export interface DashboardClientProps {
  member: Member
  familyMemberId: string | null
  initialCalls: CheckInCall[]
  callsError: string | null
  initialAlerts: Alert[]
  alertsError: string | null
  initialNotifications: RealtimeNotification[]
  notifError: string | null
  initialTasks: FamilyTaskItem[]
  tasksError: string | null
  showSubscribedBanner?: boolean
  isBirthday?: boolean
  recentCelebrations?: CelebrationEvent[]
  upcomingServices?: ServiceBooking[]
  upcomingTrackedItems?: TrackedItem[]
  serviceHistory?: ServiceBooking[]
}

function QuickActions() {
  const actions = [
    { label: 'Concierge line', sub: 'Talk to our team', href: '/dashboard/concierge' },
    { label: 'Request a volunteer', sub: 'Coordination support', href: '/volunteer' },
    { label: 'Call history', sub: 'All past conversations', href: '/dashboard/calls' },
    { label: 'Update preferences', sub: 'Call times & topics', href: '/onboarding' },
  ]

  return (
    <div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px',
          fontWeight: 500,
          color: 'var(--color-navy)',
          marginBottom: '16px',
        }}
      >
        Quick actions
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}
        className="quick-actions-grid"
      >
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '20px',
              backgroundColor: 'var(--color-warm-white)',
              border: '1px solid var(--color-warm-grey)',
              borderRadius: 'var(--radius-xl)',
              textDecoration: 'none',
              minHeight: '80px',
              transition: 'all 0.2s',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--color-navy)',
              }}
            >
              {action.label}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'var(--color-text-muted)',
              }}
            >
              {action.sub}
            </span>
          </Link>
        ))}
      </div>
      <style>{`
        @media (min-width: 768px) {
          .quick-actions-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

const MILESTONE_LABELS: Record<string, { emoji: string; label: string; color: string }> = {
  birthday: { emoji: '🎂', label: 'Birthday', color: '#f9c74f' },
  milestone_first_call: { emoji: '📞', label: 'First Check-In', color: '#4cc9f0' },
  milestone_30_day_streak: { emoji: '🔥', label: '30-Day Streak', color: '#f77f00' },
  milestone_90_days: { emoji: '⭐', label: '90 Days Together', color: '#9d4edd' },
  anniversary: { emoji: '🌟', label: 'Anniversary', color: '#43aa8b' },
}

function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setUTCHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function urgencyColor(days: number) {
  if (days <= 7) return { color: '#dc2626', bg: '#fef2f2' }
  if (days <= 30) return { color: '#d97706', bg: '#fffbeb' }
  return { color: '#059669', bg: '#f0fdf4' }
}

function UpcomingTrackedItemsSection({ items }: { items: TrackedItem[] }) {
  const upcoming = items
    .filter(i => i.status === 'active' || i.status === 'snoozed')
    .slice(0, 5)
  if (upcoming.length === 0) return null
  return (
    <section aria-labelledby="tracked-heading">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2
          id="tracked-heading"
          style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}
        >
          Important Dates
        </h2>
        <Link href="/dashboard/important-dates" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', textDecoration: 'none', fontWeight: 500 }}>
          View all →
        </Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {upcoming.map(item => {
          const days = getDaysUntil(item.expiration_or_appointment_date)
          const { color, bg } = urgencyColor(days)
          const defaults = ITEM_TYPE_DEFAULTS[item.item_type as keyof typeof ITEM_TYPE_DEFAULTS]
          const emoji = defaults?.emoji ?? '📅'
          const countdownText = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`
          return (
            <Link
              key={item.id}
              href="/dashboard/important-dates"
              style={{ textDecoration: 'none' }}
            >
              <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: `1.5px solid ${color}20`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.item_name}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {item.category === 'appointment' ? 'Appointment' : 'Renewal'} · {item.expiration_or_appointment_date}
                  </p>
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color, flexShrink: 0 }}>
                  {countdownText}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function MilestonesSection({ events }: { events: CelebrationEvent[] }) {
  if (events.length === 0) return null
  return (
    <section aria-labelledby="milestones-heading">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2
          id="milestones-heading"
          style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}
        >
          Milestones &amp; Celebrations
        </h2>
        <Link
          href="/dashboard/celebrations"
          style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', textDecoration: 'none', fontWeight: 500 }}
        >
          View all →
        </Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {events.map((event) => {
          const info = MILESTONE_LABELS[event.celebration_type] ?? { emoji: '🎉', label: event.celebration_type.replace(/_/g, ' '), color: '#4361ee' }
          const today = new Date().toISOString().slice(0, 10)
          const isToday = event.event_date === today
          return (
            <div
              key={event.id}
              style={{
                backgroundColor: isToday ? '#fff9e6' : 'white',
                border: isToday ? '2px solid #f9c74f' : '1px solid var(--color-warm-grey)',
                borderRadius: 'var(--radius-xl)',
                padding: '16px 20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <span style={{ fontSize: '28px', flexShrink: 0 }} aria-hidden="true">{info.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 2px' }}>
                  {info.label}
                </p>
                {event.ai_message && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {event.ai_message}
                  </p>
                )}
              </div>
              {isToday && (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: '#d4a017', backgroundColor: '#fff3cd', padding: '4px 10px', borderRadius: '20px', flexShrink: 0 }}>
                  Today!
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function DashboardInner(props: DashboardClientProps) {
  const {
    member,
    familyMemberId,
    initialCalls,
    callsError,
    initialAlerts,
    alertsError,
    initialTasks,
    tasksError,
    showSubscribedBanner = false,
    isBirthday = false,
    recentCelebrations = [],
    upcomingServices = [],
    upcomingTrackedItems = [],
    serviceHistory = [],
  } = props

  const [bannerVisible, setBannerVisible] = useState(showSubscribedBanner)
  const { unreadCount, markAllRead } = useNotifications(member.id)
  const latestCall = initialCalls.length > 0 ? initialCalls[0] : null

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-cream)',
        paddingBottom: '80px',
      }}
    >
      <DashNav
        seniorName={member.preferred_name}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
      />

      {/* Birthday banner */}
      {isBirthday && (
        <div
          role="status"
          style={{
            background: 'linear-gradient(135deg, #f9c74f 0%, #f8961e 100%)',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '28px' }} aria-hidden="true">🎂</span>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 600, color: '#1a1a2e', margin: 0, textAlign: 'center' }}>
            Happy Birthday, {member.preferred_name}! Wishing you a wonderful day filled with joy.
          </p>
          <span style={{ fontSize: '28px' }} aria-hidden="true">🎉</span>
        </div>
      )}

      {/* Subscription success banner */}
      {bannerVisible && (
        <div
          role="status"
          style={{
            backgroundColor: 'var(--color-teal-muted)',
            borderBottom: '1.5px solid var(--color-teal)',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
            🎉 Welcome to ThriveAtHome! Your subscription is now active.
          </p>
          <button
            onClick={() => setBannerVisible(false)}
            aria-label="Dismiss"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--color-navy)', padding: '4px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Navy page header */}
      <div
        style={{
          backgroundColor: 'var(--color-navy)',
          padding: '32px 24px 56px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(250,250,245,0.6)',
                margin: 0,
              }}
            >
              Good morning
            </p>
            {member.plan_tier && (
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(250,250,245,0.85)',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  padding: '4px 12px',
                }}
              >
                Thrive {member.plan_tier.charAt(0).toUpperCase() + member.plan_tier.slice(1)}
              </span>
            )}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 4vw, 34px)',
              fontWeight: 500,
              color: 'var(--color-cream)',
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            Checking in on {member.preferred_name}
          </h1>
        </div>
      </div>

      {/* Main content */}
      <main id="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* Wellness card overlaps navy header with negative margin */}
        <ErrorBoundary section="wellness summary">
          <WellnessCard member={member} latestCall={latestCall} />
        </ErrorBoundary>

        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Alerts */}
          <section aria-labelledby="alerts-heading">
            <h2
              id="alerts-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 500,
                color: 'var(--color-navy)',
                marginBottom: '16px',
              }}
            >
              Alerts
            </h2>
            <ErrorBoundary section="alerts">
              <AlertsPanel
                memberId={member.id}
                familyMemberId={familyMemberId}
                initialAlerts={initialAlerts}
                error={alertsError}
              />
            </ErrorBoundary>
          </section>

          {/* Milestones & Celebrations */}
          {recentCelebrations.length > 0 && (
            <ErrorBoundary section="milestones">
              <MilestonesSection events={recentCelebrations} />
            </ErrorBoundary>
          )}

          {/* Scheduled Services + History */}
          <ScheduledServicesSection bookings={upcomingServices} history={serviceHistory} />

          {/* Important Dates */}
          <UpcomingTrackedItemsSection items={upcomingTrackedItems} />

          {/* Health timeline */}
          <section aria-labelledby="timeline-heading">
            <h2
              id="timeline-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 500,
                color: 'var(--color-navy)',
                marginBottom: '16px',
              }}
            >
              Health timeline
            </h2>
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-warm-grey)',
                boxShadow: 'var(--shadow-card)',
                padding: '24px',
                overflow: 'hidden',
              }}
            >
              <ErrorBoundary section="health timeline">
                {callsError ? (
                  <SectionError message="Unable to load mood data. Please refresh the page." />
                ) : (
                  <MoodChart calls={initialCalls} />
                )}
              </ErrorBoundary>
            </div>
          </section>

          {/* Two-column: recent calls + tasks */}
          <div
            style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr' }}
            className="dash-two-col"
          >
            <section aria-labelledby="calls-heading">
              <h2
                id="calls-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '24px',
                  fontWeight: 500,
                  color: 'var(--color-navy)',
                  marginBottom: '16px',
                }}
              >
                Recent calls
              </h2>
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--color-warm-grey)',
                  boxShadow: 'var(--shadow-card)',
                  padding: '24px',
                }}
              >
                <ErrorBoundary section="recent calls">
                  <RecentCallsList calls={initialCalls} error={callsError} />
                </ErrorBoundary>
              </div>
            </section>

            <section aria-labelledby="tasks-heading">
              <h2
                id="tasks-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '24px',
                  fontWeight: 500,
                  color: 'var(--color-navy)',
                  marginBottom: '16px',
                }}
              >
                Family tasks
              </h2>
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--color-warm-grey)',
                  boxShadow: 'var(--shadow-card)',
                  padding: '24px',
                }}
              >
                <ErrorBoundary section="family tasks">
                  <TasksPanel tasks={initialTasks} error={tasksError} />
                </ErrorBoundary>
              </div>
            </section>
          </div>

          {/* Quick actions */}
          <QuickActions />
        </div>
      </main>

      <style>{`
        @media (min-width: 768px) {
          .dash-two-col { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default function DashboardClient(props: DashboardClientProps) {
  return (
    <ToastProvider>
      <DashboardInner {...props} />
    </ToastProvider>
  )
}
