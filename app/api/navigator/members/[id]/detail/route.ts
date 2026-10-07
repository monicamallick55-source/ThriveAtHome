import { NextResponse } from 'next/server'
import { getCurrentUser, getUserRole, isNavigatorOrAdmin } from '@/lib/auth'
import { getNavigatorByAuthId, getMemberRecentCalls, getMemberFamilyContacts, getMemberNavigatorNotes, isMemberAssignedToNavigator } from '@/lib/data/navigator'
import { getMemberById } from '@/lib/data/members'
import { getServiceBookingsForMember } from '@/lib/data/services'
import { getTrackedItemsForMember } from '@/lib/data/tracked-items'
import { getDevicesForMember, getFallEventsForMember, getWearableConnectionsForMember } from '@/lib/data/devices'
import { getMlSummaryForMember } from '@/lib/data/ml'
import { getNavigatorSharedDocuments } from '@/lib/data/documents'
import { getAdvisorConnectionsForMember } from '@/lib/data/advisors'
import { getMemberCulturalEngagement } from '@/lib/data/cultural'
import { getMemberAddonSummary } from '@/lib/data/premium-addons'
import { getMemberPetSummary } from '@/lib/data/pets'
import { getBuddySummaryForMember } from '@/lib/data/buddies'
import { aiProvider } from '@/lib/providers'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memberId } = await params

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.id

  const role = await getUserRole(userId)
  if (!(await isNavigatorOrAdmin(userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: navigator, error: navError } = await getNavigatorByAuthId(userId)
  if (navError || !navigator) {
    return NextResponse.json({ error: 'Navigator profile not found' }, { status: 404 })
  }

  if (role !== 'admin') {
    const assigned = await isMemberAssignedToNavigator(memberId, navigator.id)
    if (!assigned) {
      return NextResponse.json({ error: 'Not assigned to this member' }, { status: 403 })
    }
  }

  const [
    memberResult,
    callsResult,
    familyResult,
    notesResult,
    bookingsResult,
    trackedItemsResult,
    devicesResult,
    fallEventsResult,
    wearablesResult,
    mlSummaryResult,
    sharedDocsResult,
    advisorConnectionsResult,
    culturalEngagement,
    premiumAddons,
    petSummary,
    buddySummary,
  ] = await Promise.all([
    getMemberById(memberId),
    getMemberRecentCalls(memberId, 5),
    getMemberFamilyContacts(memberId),
    getMemberNavigatorNotes(memberId),
    getServiceBookingsForMember(memberId),
    getTrackedItemsForMember(memberId, ['active', 'snoozed']),
    getDevicesForMember(memberId),
    getFallEventsForMember(memberId, 10),
    getWearableConnectionsForMember(memberId),
    getMlSummaryForMember(memberId),
    getNavigatorSharedDocuments(memberId),
    getAdvisorConnectionsForMember(memberId),
    getMemberCulturalEngagement(memberId),
    getMemberAddonSummary(memberId),
    getMemberPetSummary(memberId),
    getBuddySummaryForMember(memberId),
  ])

  if (memberResult.error || !memberResult.data) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  const summaries = (callsResult.data ?? [])
    .map((c: any) => c.ai_summary)
    .filter((s): s is string => Boolean(s))

  let brief = 'Navigator brief unavailable.'
  try {
    brief = await aiProvider.generateNavigatorBrief(memberId, summaries)
  } catch (e) {
    console.error('[api/navigator/members/detail] brief generation failed:', e)
  }

  return NextResponse.json({
    member: memberResult.data,
    calls: callsResult.data ?? [],
    family: familyResult.data ?? [],
    notes: notesResult.data ?? [],
    brief,
    navigatorId: navigator.id,
    bookings: bookingsResult.data ?? [],
    trackedItems: trackedItemsResult.data ?? [],
    devices: devicesResult.data ?? [],
    fallEvents: fallEventsResult.data ?? [],
    wearables: wearablesResult.data ?? [],
    mlInsights: mlSummaryResult.data ?? null,
    sharedDocuments: sharedDocsResult.data ?? [],
    advisorConnections: advisorConnectionsResult.data ?? [],
    culturalEngagement,
    premiumAddons,
    petSummary,
    buddySummary: buddySummary.data,
  })
}
