// app/api/circles/events/[id]/rsvp/route.ts
// G5.8 — Toggle RSVP for a circle event; auto-create/cancel ride booking when requested

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/circles/events/[id]/rsvp
// Body: { going: boolean; needs_ride?: boolean; pickup_address?: string }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm || !fm.member_id) return NextResponse.json({ error: 'No member context' }, { status: 403 })
  const memberId = fm.member_id as string

  const body = await request.json() as {
    going: boolean
    needs_ride?: boolean
    pickup_address?: string
  }
  const { going, needs_ride, pickup_address } = body

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Fetch event details (need title, start_time, location for ride booking)
  const { data: event } = await admin
    .from('circle_events')
    .select('id, title, start_time, location_text, status, circle_id')
    .eq('id', eventId)
    .maybeSingle()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (event.status !== 'approved' && event.status !== 'published') return NextResponse.json({ error: 'Event is not available for RSVP' }, { status: 400 })

  // Verify member belongs to the circle (or event is platform-wide: circle_id IS NULL)
  if (event.circle_id) {
    const { data: membership } = await admin
      .from('circle_memberships')
      .select('id')
      .eq('circle_id', event.circle_id)
      .eq('member_id', memberId)
      .maybeSingle()
    if (!membership) return NextResponse.json({ error: 'Not a member of this circle' }, { status: 403 })
  }

  // Toggle RSVP
  if (going) {
    await admin
      .from('circle_event_rsvps')
      .upsert({ event_id: eventId, member_id: memberId }, { onConflict: 'event_id,member_id' })
  } else {
    // Cancel RSVP
    await admin
      .from('circle_event_rsvps')
      .delete()
      .eq('event_id', eventId)
      .eq('member_id', memberId)

    // Cancel any linked ride bookings for this event
    await admin
      .from('ride_bookings')
      .update({ status: 'cancelled', cancellation_reason: 'rsvp_cancelled' })
      .eq('event_id', eventId)
      .eq('member_id', memberId)
      .in('status', ['requested', 'confirmed'])

    return NextResponse.json({ going: false, ride_cancelled: true })
  }

  // Handle ride booking request
  let rideBooking = null
  if (going && needs_ride) {
    // Get member home address as fallback pickup
    const { data: member } = await admin
      .from('members')
      .select('home_address')
      .eq('id', memberId)
      .maybeSingle()

    const pickup = pickup_address ?? member?.home_address ?? 'Member home address (please update)'
    const dropoff = event.location_text ?? 'Event location'

    // Arrive 15 minutes before event
    let pickupTime: string | null = null
    if (event.start_time) {
      const arrival = new Date(event.start_time as string)
      arrival.setMinutes(arrival.getMinutes() - 15)
      pickupTime = arrival.toISOString()
    }

    // Check for existing ride booking for this event
    const { data: existing } = await admin
      .from('ride_bookings')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('member_id', memberId)
      .not('status', 'in', '(cancelled)')
      .maybeSingle()

    if (!existing) {
      const { data: booking } = await admin
        .from('ride_bookings')
        .insert({
          member_id: memberId,
          event_id: eventId,
          pickup_address: pickup,
          dropoff_address: dropoff,
          pickup_time: pickupTime,
          notes: `Ride to event: ${event.title as string}. Return trip also needed.`,
          status: 'requested',
        })
        .select()
        .single()
      rideBooking = booking
    }
  }

  return NextResponse.json({ going: true, ride_booking: rideBooking })
}

// DELETE /api/circles/events/[id]/rsvp — cancel RSVP
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm || !fm.member_id) return NextResponse.json({ error: 'No member context' }, { status: 403 })
  const memberId = fm.member_id as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  await admin.from('circle_event_rsvps').delete().eq('event_id', eventId).eq('member_id', memberId)
  await admin.from('ride_bookings')
    .update({ status: 'cancelled', cancellation_reason: 'rsvp_cancelled' })
    .eq('event_id', eventId).eq('member_id', memberId).in('status', ['requested', 'confirmed'])

  return NextResponse.json({ going: false })
}

// GET /api/circles/events/[id]/rsvp — check current member's RSVP + ride status
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm?.member_id) return NextResponse.json({ going: false, ride_booking: null })
  const memberId = fm.member_id as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data: rsvp } = await admin
    .from('circle_event_rsvps')
    .select('id')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .maybeSingle()

  const { data: ride } = await admin
    .from('ride_bookings')
    .select('id, status, pickup_time, pickup_address, dropoff_address')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .not('status', 'in', '(cancelled)')
    .maybeSingle()

  return NextResponse.json({ going: !!rsvp, ride_booking: ride ?? null })
}
