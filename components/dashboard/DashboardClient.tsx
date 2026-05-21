'use client'
import Link from 'next/link'
import { ToastProvider } from '@/components/ui/Toast'
import { SectionError } from './SectionError'
import { DashNav } from './DashNav'
import { WellnessCard } from './WellnessCard'
import { AlertsPanel } from './AlertsPanel'
import { MoodChart } from './MoodChart'
import { RecentCallsList } from './RecentCallsList'
import { TasksPanel } from './TasksPanel'
import { StatusDot } from '@/components/ui/StatusDot'
import { useNotifications } from '@/lib/realtime/useNotifications'
import type { Member } from '@/lib/data/members'
import type { CheckInCall } from '@/lib/data/calls'
import type { Alert } from '@/lib/data/alerts'
import type { RealtimeNotification } from '@/lib/data/notifications'
import type { FamilyTaskItem } from '@/lib/data/tasks'
import type { StatusLevel } from '@/components/ui/StatusDot'

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
}

const statusLevelMap: Record<string, StatusLevel> = {
  active: 'no_alerts',
  inactive: 'informational',
  paused: 'concern',
}

function QuickActions() {
  const actions = [
    { label: 'Talk to our team', icon: '📞', href: '#' },
    { label: 'Request a volunteer', icon: '🤝', href: '#' },
    { label: 'View call history', icon: '🕐', href: '/dashboard/calls' },
    { label: 'Update preferences', icon: '⚙️', href: '/onboarding' },
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
              alignItems: 'center',
              gap: '12px',
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
            <span style={{ fontSize: '24px', flexShrink: 0 }}>{action.icon}</span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                fontWeight: 500,
                color: 'var(--color-navy)',
              }}
            >
              {action.label}
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
  } = props

  const { unreadCount, markAllRead } = useNotifications(member.id)
  const latestCall = initialCalls.length > 0 ? initialCalls[0] : null
  const statusLevel = statusLevelMap[member.status] ?? 'informational'
  const familyInitial = 'F'

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
        familyInitial={familyInitial}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
      />

      {/* Navy page header */}
      <div
        style={{
          backgroundColor: 'var(--color-navy)',
          padding: '32px 24px 56px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(250,250,245,0.6)',
                margin: '0 0 8px',
              }}
            >
              Good morning
            </p>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusDot level={statusLevel} size="md" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(250,250,245,0.8)' }}>
              {member.status === 'active' ? 'All good' : 'Check required'}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main id="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* Wellness card overlaps navy header with negative margin */}
        <WellnessCard member={member} latestCall={latestCall} />

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
            <AlertsPanel
              memberId={member.id}
              familyMemberId={familyMemberId}
              initialAlerts={initialAlerts}
              error={alertsError}
            />
          </section>

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
              {callsError ? (
                <SectionError message="Unable to load mood data. Please refresh the page." />
              ) : (
                <MoodChart calls={initialCalls} />
              )}
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
                <RecentCallsList calls={initialCalls} error={callsError} />
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
                <TasksPanel tasks={initialTasks} error={tasksError} />
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
