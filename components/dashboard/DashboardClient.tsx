'use client'
// DashboardClient — client-side shell: realtime subscriptions, notifications, and section rendering.
import { ToastProvider } from '@/components/ui/Toast'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { MemberCard } from './MemberCard'
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

function DashboardInner(props: DashboardClientProps) {
  const { member, familyMemberId, initialCalls, callsError, initialAlerts, alertsError, initialTasks, tasksError } = props

  const { unreadCount, markAllRead } = useNotifications(member.id)

  return (
    <div className="min-h-screen bg-brand-warm-white">
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-10 bg-brand-navy shadow-md" aria-label="Dashboard navigation">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <span className="text-white text-xl font-bold tracking-tight">ThriveAtHome</span>
          <div className="flex items-center gap-4">
            <NotificationBell
              count={unreadCount}
              onClick={markAllRead}
              label="Notifications"
            />
            <a
              href="/login"
              className="text-white text-base hover:text-brand-teal-light transition-colors"
            >
              Sign out
            </a>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8" id="main-content">
        {/* Member header */}
        <MemberCard member={member} />

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardBody>
            <AlertsPanel
              memberId={member.id}
              familyMemberId={familyMemberId}
              initialAlerts={initialAlerts}
              error={alertsError}
            />
          </CardBody>
        </Card>

        {/* Mood health timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Mood Timeline</CardTitle>
          </CardHeader>
          <CardBody>
            {callsError ? (
              <div role="alert" className="text-lg text-red-700">
                Unable to load mood data. Please refresh the page.
              </div>
            ) : (
              <MoodChart calls={initialCalls} />
            )}
          </CardBody>
        </Card>

        {/* Two-column grid for calls and tasks */}
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Calls</CardTitle>
            </CardHeader>
            <CardBody>
              <RecentCallsList calls={initialCalls} error={callsError} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Family Tasks</CardTitle>
            </CardHeader>
            <CardBody>
              <TasksPanel tasks={initialTasks} error={tasksError} />
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  )
}

/** Wraps DashboardInner in ToastProvider so useNotifications (→ useToast) works. */
export default function DashboardClient(props: DashboardClientProps) {
  return (
    <ToastProvider>
      <DashboardInner {...props} />
    </ToastProvider>
  )
}
