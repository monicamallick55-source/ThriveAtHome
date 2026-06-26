import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getVolunteerByAuthId } from '@/lib/data/volunteers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: volunteer, error: volError } = await getVolunteerByAuthId(user.id)
  if (volError || !volunteer || volunteer.status !== 'active') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Open service bookings (status=requested, no volunteer_id assigned, not urgent)
  const { data: serviceBookings } = await admin
    .from('service_bookings')
    .select('id, created_at, service_type, booking_details, requested_for, status, notes, member_id')
    .eq('status', 'requested')
    .is('volunteer_id', null)
    .order('requested_for', { ascending: true })
    .limit(30)

  // Open member needs from community orgs
  const { data: memberNeeds } = await (admin.from as any)('member_needs')
    .select('id, created_at, org_id, need_type, title, description, urgency, preferred_date, preferred_time, status')
    .eq('status', 'open')
    .order('urgency', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(30)

  // Claimed service bookings for this volunteer (for "My Upcoming" section)
  const { data: claimedBookings } = await admin
    .from('service_bookings')
    .select('id, created_at, service_type, booking_details, requested_for, status, member_id')
    .eq('volunteer_id', volunteer.id)
    .not('status', 'eq', 'cancelled')
    .not('status', 'eq', 'completed')
    .order('requested_for', { ascending: true })
    .limit(10)

  // Filter out urgent service bookings from self-service (they require navigator dispatch)
  const selfClaimableBookings = (serviceBookings ?? []).filter((b: any) => {
    const details = b.booking_details ?? {}
    return details.urgency !== 'urgent' && details.sub_type !== 'other_roadside'
  })

  return NextResponse.json({
    serviceBookings: selfClaimableBookings,
    memberNeeds: memberNeeds ?? [],
    claimedBookings: claimedBookings ?? [],
  })
}
