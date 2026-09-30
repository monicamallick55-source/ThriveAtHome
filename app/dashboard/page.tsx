// Dashboard server component — fetches all data in parallel (8-second timeout per section).
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { getCallsForMember } from '@/lib/data/calls'
import { getAlertsForMember } from '@/lib/data/alerts'
import { getNotificationsForMember } from '@/lib/data/notifications'
import { getTasksForMember } from '@/lib/data/tasks'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { syncMemberSubscription } from '@/lib/stripe/sync'
import { isTodayBirthday, getRecentCelebrationEvents } from '@/lib/data/celebrations'
import { getUpcomingServiceBookings, getRecentCompletedServiceBookings } from '@/lib/data/services'
import { getUpcomingTrackedItems } from '@/lib/data/tracked-items'
import { getBrandConfigForMember } from '@/lib/data/brandConfigs'
import { getDeviceSummaryForMember, type DeviceSummary } from '@/lib/data/devices'
import { getMlSummaryForMember, type MlSummary } from '@/lib/data/ml'
import DashboardClient from '@/components/dashboard/DashboardClient'
import type { FamilyCall as CheckInCall } from '@/lib/data/calls'
import type { Alert } from '@/lib/data/alerts'
import type { RealtimeNotification } from '@/lib/data/notifications'
import type { FamilyTaskItem } from '@/lib/data/tasks'
import type { FamilyMember } from '@/lib/data/family'
import type { CelebrationEvent } from '@/lib/data/celebrations'
import type { ServiceBooking } from '@/lib/data/services'
import type { TrackedItem } from '@/lib/data/tracked-items-types'
import type { BrandConfigRow } from '@/types/database'

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string }>
}) {
  const [user, params] = await Promise.all([requireAuth(), searchParams])
  const showSubscribedBanner = params.subscribed === 'true'

  // Route non-family roles to their correct portals so the family dashboard never
  // tries to render for a navigator, volunteer, student, or university_admin.
  const role = await getUserRole(user.id)
  if (role === 'university_admin') redirect('/university-admin')
  if (role === 'employer_admin') redirect('/employer-admin')
  if (role === 'navigator') redirect('/navigator')
  if (role === 'volunteer') redirect('/volunteer/dashboard')
  if (role === 'student') redirect('/student')

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

  // A senior who enrolled themselves (members.supabase_auth_id === their auth id)
  // sees the member self-service portal, not the family-proxy dashboard.
  if (member.supabase_auth_id === user.id) {
    redirect('/member-portal')
  }

  // If redirected here after checkout, sync subscription from Stripe directly.
  // This is a reliable fallback in case the Stripe webhook hasn't fired yet
  // (e.g. STRIPE_WEBHOOK_SECRET not yet set in Vercel env vars).
  if (showSubscribedBanner && user.email) {
    await syncMemberSubscription(member.id, user.email)
  }

  const [
    callsResult,
    alertsResult,
    notifResult,
    tasksResult,
    fmResult,
    celebrationsResult,
    servicesResult,
    trackedItemsResult,
    serviceHistoryResult,
    brandConfigResult,
    deviceSummaryResult,
    mlSummaryResult,
  ] = await Promise.all([
    withTimeout<CheckInCall[]>(getCallsForMember(member.id, 90, 0, user.id)),
    withTimeout<Alert[]>(getAlertsForMember(member.id)),
    withTimeout<RealtimeNotification[]>(getNotificationsForMember(member.id)),
    withTimeout<FamilyTaskItem[]>(getTasksForMember(member.id)),
    withTimeout<FamilyMember>(getFamilyMemberByAuthId(user.id)),
    withTimeout<CelebrationEvent[]>(getRecentCelebrationEvents(member.id, 3)),
    withTimeout<ServiceBooking[]>(getUpcomingServiceBookings(member.id)),
    withTimeout<TrackedItem[]>(getUpcomingTrackedItems(member.id)),
    withTimeout<ServiceBooking[]>(getRecentCompletedServiceBookings(member.id, 3)),
    withTimeout<BrandConfigRow>(getBrandConfigForMember(member.id)),
    withTimeout<DeviceSummary>(getDeviceSummaryForMember(member.id)),
    withTimeout<MlSummary>(getMlSummaryForMember(member.id)),
  ])

  const memberIsBirthday = member.date_of_birth ? isTodayBirthday(member.date_of_birth) : false

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
      showSubscribedBanner={showSubscribedBanner}
      isBirthday={memberIsBirthday}
      recentCelebrations={celebrationsResult.data ?? []}
      upcomingServices={servicesResult.data ?? []}
      upcomingTrackedItems={trackedItemsResult.data ?? []}
      serviceHistory={serviceHistoryResult.data ?? []}
      brandConfig={brandConfigResult.data ?? null}
      deviceSummary={deviceSummaryResult.data ?? null}
      mlSummary={mlSummaryResult.data ?? null}
    />
  )
}
