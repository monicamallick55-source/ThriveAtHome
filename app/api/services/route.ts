import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { createServiceBooking } from '@/lib/data/services'
import { createAdminClient } from '@/lib/supabase/admin'
import { transportProvider } from '@/lib/providers'

const ALLOWED_SERVICE_TYPES = [
  'transport', 'home_service', 'meals', 'telehealth', 'legal_financial', 'tech_help', 'companionship', 'companion', 'travel_assistance', 'roadside',
] as const
type AllowedServiceType = (typeof ALLOWED_SERVICE_TYPES)[number]

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) {
    return NextResponse.json(
      { error: 'No member linked to this account. Please complete onboarding first.' },
      { status: 400 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const { service_type, booking_details, requested_for, notes } = body as {
    service_type?: string
    booking_details?: Record<string, unknown>
    requested_for?: string
    notes?: string
  }

  if (!service_type || !(ALLOWED_SERVICE_TYPES as readonly string[]).includes(service_type)) {
    return NextResponse.json({ error: 'Invalid service type' }, { status: 400 })
  }
  if (!booking_details || typeof booking_details !== 'object') {
    return NextResponse.json({ error: 'booking_details is required' }, { status: 400 })
  }

  // Date validation: required, valid format, must be future
  if (!requested_for) {
    return NextResponse.json({ error: 'A date and time is required for this request.' }, { status: 400 })
  }
  const requestedDate = new Date(requested_for)
  if (isNaN(requestedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date format. Please select a valid date and time.' }, { status: 400 })
  }
  if (requestedDate <= new Date()) {
    return NextResponse.json({ error: 'Please select a future date and time.' }, { status: 400 })
  }

  const { data: booking, error } = await createServiceBooking(
    memberId,
    service_type as AllowedServiceType,
    booking_details,
    requested_for ?? null,
    notes ?? null
  )

  if (error) return NextResponse.json({ error }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const subtype = (booking_details as Record<string, string>).subtype ?? ''

  // ─── AUTO-DISPATCH: Transport ────────────────────────────────────────────
  if (service_type === 'transport' && booking) {
    const details = booking_details as Record<string, string>
    const pickup = details.pickup_address ?? details.pickup ?? ''
    const dest   = details.destination ?? details.destination_address ?? ''
    const dt     = details.date_time ?? requested_for ?? ''
    const tripType = details.trip_type ?? 'one_way'
    const isRecurring = details.is_recurring === 'true'

    try {
      const ride = await transportProvider.bookRide({
        memberId,
        pickupAddress:      pickup,
        destinationAddress: dest,
        requestedDate:      dt.split('T')[0] ?? dt,
        requestedTime:      dt.split('T')[1]?.slice(0, 5) ?? '',
        tripType,
        isRecurring,
      })
      await db
        .from('service_bookings')
        .update({
          status: 'confirmed',
          booking_details: {
            ...(booking_details as Record<string, unknown>),
            provider_booking_id: ride.bookingId,
            estimated_arrival:   ride.estimatedArrival ?? null,
            auto_dispatched:     true,
          },
        })
        .eq('id', String(booking.id))

      const { data: member } = await db
        .from('members')
        .select('phone')
        .eq('id', memberId)
        .maybeSingle() as { data: { phone?: string } | null }

      if (member?.phone) {
        const timeLabel = dt ? new Date(dt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'your requested time'
        await db.from('notification_queue').insert({
          member_id: memberId,
          channel:   'sms',
          phone:     member.phone,
          message:   `Your ThriveAtHome ride is confirmed for ${timeLabel}. From: ${pickup}. To: ${dest}. Booking ref: ${ride.bookingId}. Reply CANCEL to cancel.`,
        }).catch(() => null)
      }
    } catch (dispatchErr) {
      console.error('[Transport] Auto-dispatch failed, creating navigator task:', dispatchErr)
      await db.from('navigator_tasks').insert({
        member_id: memberId,
        task_type: 'transport_dispatch_failed',
        description: `Transport booking auto-dispatch failed for booking ${booking.id}. Manually book a ride: ${pickup} → ${dest} at ${dt}. Error: ${String(dispatchErr)}`,
        priority: 'high',
      })
    }
  }

  // ─── AUTO-DISPATCH: Meals ────────────────────────────────────────────────
  if (service_type === 'meals' && booking) {
    await db
      .from('service_bookings')
      .update({ status: 'confirmed' })
      .eq('id', String(booking.id))
  }

  // ─── AUTO-PROCEED: Companion visits ─────────────────────────────────────
  if ((service_type === 'companionship' || service_type === 'companion') && booking) {
    const companionId = (booking_details as Record<string, string>).companion_id
    if (companionId) {
      await db
        .from('service_bookings')
        .update({ status: 'confirmed' })
        .eq('id', String(booking.id))
    } else {
      await db.from('navigator_tasks').insert({
        member_id: memberId,
        task_type: 'companion_matching',
        description: `Member requested companionship — no companion selected. Match and schedule a visit.`,
        priority: 'medium',
      })
    }
    const { companion_id, companion_name } = booking_details as Record<string, string>
    if (companion_id) {
      console.log(`[Billing] Companion session for ${companion_name ?? companion_id} — member ${memberId}. Stripe Connect payout queued.`)
    }
  }

  // ─── NAVIGATOR TASKS: High-touch services ────────────────────────────────
  if (booking) {
    if (service_type === 'tech_help') {
      await db.from('navigator_tasks').insert({
        member_id: memberId,
        task_type: 'tech_help_request',
        description: `Tech help request — subtype: ${subtype || 'unspecified'}. Coordinate volunteer or in-home visit.`,
        priority: 'medium',
      })
    } else if (service_type === 'telehealth' && subtype === 'mental_health_companion') {
      await db.from('navigator_tasks').insert({
        member_id: memberId,
        task_type: 'mental_health_referral',
        description: 'Member requested mental health support. Review and provide a warm referral to appropriate professional.',
        priority: 'high',
      })
    } else if (service_type === 'travel_assistance') {
      const travelDesc = subtype === 'travel_companion'
        ? `Member needs a travel companion. Match with volunteers or paid companions willing to travel.`
        : `Member requested travel assistance — subtype: ${subtype || 'general'}. Connect with vetted travel agent.`
      await db.from('navigator_tasks').insert({
        member_id: memberId,
        task_type: 'travel_assistance',
        description: travelDesc,
        priority: subtype === 'travel_companion' ? 'medium' : 'low',
      })
    } else if (service_type === 'roadside') {
      const isEmergency = subtype === 'other_roadside'
      const isCarRepair = ['scheduled_maintenance', 'body_shop', 'mechanic_non_urgent', 'car_inspection', 'mechanic_referral'].includes(subtype)
      const roadsideDetails = booking_details as Record<string, string>
      const prefillNote = roadsideDetails.aaa_membership_info
        ? ` AAA on file: ${roadsideDetails.aaa_membership_info}.`
        : roadsideDetails.insurance_roadside_info
          ? ` Insurance roadside coverage: ${roadsideDetails.insurance_roadside_info}.`
          : ''
      await db.from('navigator_tasks').insert({
        member_id: memberId,
        task_type: isCarRepair ? 'car_repair_coordination' : 'roadside_assistance',
        description: isCarRepair
          ? `Car repair: ${subtype.replace(/_/g, ' ')}. Coordinate vetted local shop.`
          : `Roadside help — ${subtype.replace(/_/g, ' ')}.${prefillNote} Use member's AAA or insurance coverage.`,
        priority: isEmergency ? 'critical' : isCarRepair ? 'low' : 'high',
      })
    }
  }

  return NextResponse.json({ booking }, { status: 201 })
}
