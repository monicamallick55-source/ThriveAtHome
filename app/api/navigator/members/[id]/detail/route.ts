import { NextResponse } from 'next/server'
import { getCurrentUser, getUserRole } from '@/lib/auth'
import { getNavigatorByAuthId, getMemberRecentCalls, getMemberFamilyContacts, getMemberNavigatorNotes, isMemberAssignedToNavigator } from '@/lib/data/navigator'
import { getMemberById } from '@/lib/data/members'
import { getServiceBookingsForMember } from '@/lib/data/services'
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
  if (role !== 'navigator' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: navigator, error: navError } = await getNavigatorByAuthId(userId)
  if (navError || !navigator) {
    return NextResponse.json({ error: 'Navigator not found' }, { status: 404 })
  }

  if (role !== 'admin') {
    const assigned = await isMemberAssignedToNavigator(memberId, navigator.id)
    if (!assigned) {
      return NextResponse.json({ error: 'Not assigned to this member' }, { status: 403 })
    }
  }

  const [memberResult, callsResult, familyResult, notesResult, bookingsResult] = await Promise.all([
    getMemberById(memberId),
    getMemberRecentCalls(memberId, 5),
    getMemberFamilyContacts(memberId),
    getMemberNavigatorNotes(memberId),
    getServiceBookingsForMember(memberId),
  ])

  if (memberResult.error || !memberResult.data) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  const summaries = (callsResult.data ?? [])
    .map(c => c.ai_summary)
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
  })
}
