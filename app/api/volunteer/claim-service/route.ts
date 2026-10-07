import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getVolunteerByAuthId } from '@/lib/data/volunteers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: volunteer, error: volError } = await getVolunteerByAuthId(user.id)
  if (volError || !volunteer || volunteer.status !== 'active') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.booking_id) return NextResponse.json({ error: 'booking_id required' }, { status: 400 })

  const admin = createAdminClient()

  // Fetch the booking to validate it's still claimable
  const { data: booking } = await admin
    .from('service_bookings')
    .select('id, status, volunteer_id, member_id, booking_details')
    .eq('id', body.booking_id)
    .maybeSingle() as unknown as { data: { id: string; status: string; volunteer_id: string | null; member_id: string; booking_details: Record<string, unknown> } | null }

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status !== 'requested') return NextResponse.json({ error: 'This request is no longer available' }, { status: 409 })
  if (booking.volunteer_id) return NextResponse.json({ error: 'This request has already been claimed' }, { status: 409 })

  // Reject urgent requests
  const details = (booking.booking_details ?? {}) as Record<string, unknown>
  if (details.urgency === 'urgent' || details.sub_type === 'other_roadside') {
    return NextResponse.json({ error: 'Urgent requests require navigator dispatch. Please contact your navigator.' }, { status: 400 })
  }

  // Claim the booking
  const { error } = await admin
    .from('service_bookings')
    .update({
      volunteer_id: volunteer.id,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      booking_details: { ...details, self_claimed: true, claimed_by_volunteer_id: volunteer.id, claimed_at: new Date().toISOString() },
    })
    .eq('id', body.booking_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify navigator via realtime
  try {
    await (admin as any).from('realtime_notifications').insert({
      member_id: booking.member_id,
      type: 'volunteer_matched' as const,
      severity: 'info' as const,
      title: 'Volunteer claimed your request',
      body: 'A volunteer has picked up your service request and will be in touch soon.',
    })
  } catch { /* best-effort */ }

  return NextResponse.json({ success: true })
}
