// Dashboard server component — fetches all data in parallel (8-second timeout per section).
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { getCallsForMember } from '@/lib/data/calls'
import { getAlertsForMember } from '@/lib/data/alerts'
import { getNotificationsForMember } from '@/lib/data/notifications'
import { getTasksForMember } from '@/lib/data/tasks'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import DashboardClient from '@/components/dashboard/DashboardClient'
import type { CheckInCall } from '@/lib/data/calls'
import type { Alert } from '@/lib/data/alerts'
import type { RealtimeNotification } from '@/lib/data/notifications'
import type { FamilyTaskItem } from '@/lib/data/tasks'
import type { FamilyMember } from '@/lib/data/family'

export const metadata: Metadata = { title: 'Dashboard — ThriveAtHome' }

async function withTimeout<T>(
  promise: Promise<{ data: T | null; error: string | null }>
): Promise<{ data: T | null; error: string | null }> {
  const timeout = new Promise<{ data: T | null; error: string | null }>((resolve) =>
    setTimeout(
      () => resolve({ data: null, error: 'Request timed out. Please refresh this section.' }),
      8000
    )
  )
  return Promise.race([promise, timeout])
}

export default async function DashboardPage() {
  const user = await requireAuth()

  const { data: member, error: memberError } = await withTimeout(
    getMemberForAuthUser(user.id)
  )

  if (!member) {
    // Not found means onboarding is incomplete; any other error redirects to login for safety
    if (memberError === 'Not found' || !memberError) {
      redirect('/onboarding')
    }
    redirect('/onboarding')
  }

  const [
    callsResult,
    alertsResult,
    notifResult,
    tasksResult,
    fmResult,
  ] = await Promise.all([
    withTimeout<CheckInCall[]>(getCallsForMember(member.id, 90)),
    withTimeout<Alert[]>(getAlertsForMember(member.id)),
    withTimeout<RealtimeNotification[]>(getNotificationsForMember(member.id)),
    withTimeout<FamilyTaskItem[]>(getTasksForMember(member.id)),
    withTimeout<FamilyMember>(getFamilyMemberByAuthId(user.id)),
  ])

  return (
    <DashboardClient
      member={member}
      familyMemberId={fmResult.data?.id ?? null}
      initialCalls={callsResult.data ?? []}
      callsError={callsResult.error}
      initialAlerts={alertsResult.data ?? []}
      alertsError={alertsResult.error}
      initialNotifications={notifResult.data ?? []}
      notifError={notifResult.error}
      initialTasks={tasksResult.data ?? []}
      tasksError={tasksResult.error}
    />
  )
}
