import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserRole } from '@/lib/auth'
import { updateBookingStatus, getServiceBookingsForMember } from '@/lib/data/services'
import { createAdminClient } from '@/lib/supabase/admin'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { pushRealtimeNotification } from '@/lib/realtime/notifications'
import type { BookingStatus } from '@/types/database'

const VALID_STATUSES: BookingStatus[] = ['requested', 'confirmed', 'in_progress', 'completed', 'cancelled']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id)
  if (role !== 'navigator' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const { status, navigator_note, cancel_reason, dispatch_type, dispatch_details, volunteer_id, action, scheduled_time, new_provider_name } = body as {
    status?: string
    navigator_note?: string
    cancel_reason?: string
    dispatch_type?: string
    dispatch_details?: Record<string, string>
    volunteer_id?: string
    action?: string  // 'reassign' | 'reschedule' | 'unschedule'
    scheduled_time?: string
    new_provider_name?: string
  }

  // For unschedule action, status is optional (we use the current booking status)
  if (action !== 'unschedule') {
    if (!status || !VALID_STATUSES.includes(status as BookingStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
  }

  // Get the booking to find the member_id
  const admin = createAdminClient()
  const { data: booking, error: fetchErr } = await admin
    .from('service_bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle()

  if (fetchErr || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Determine the effective target status
  const targetStatus = (action === 'unschedule') ? (booking.status as BookingStatus) : (status as BookingStatus)

  // Update booking status
  const updates: Record<string, unknown> = { status: targetStatus }
  if (targetStatus === 'confirmed' && booking.status !== 'confirmed') updates.confirmed_at = new Date().toISOString()
  if (targetStatus === 'completed') updates.completed_at = new Date().toISOString()
  if (cancel_reason) updates.notes = cancel_reason
  if (volunteer_id) updates.volunteer_id = volunteer_id

  if (navigator_note) {
    // Append note to existing notes
    const existing = booking.notes ? `${booking.notes}\n\n` : ''
    updates.notes = `${existing}[Navigator ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}] ${navigator_note}`
  }

  if (action === 'unschedule') {
    // Clear scheduled_time and dispatch info — return booking to an unscheduled state
    const existingDetails = (booking.booking_details as Record<string, unknown>) ?? {}
    const { scheduled_time: _st, dispatch_type: _dt, assigned_volunteer: _av, assigned_provider: _ap, ...rest } = existingDetails
    void _st; void _dt; void _av; void _ap
    updates.booking_details = rest
    updates.status = booking.status  // keep current status unchanged
  } else if (action === 'reschedule' && scheduled_time) {
    // Validate: scheduled_time must be in the future
    const scheduledDate = new Date(scheduled_time)
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return NextResponse.json({ error: 'Scheduled time must be a valid future date and time.' }, { status: 400 })
    }
    const existingDetails = (booking.booking_details as Record<string, unknown>) ?? {}
    const rescheduleUpdate: Record<string, unknown> = { ...existingDetails, scheduled_time }
    if (new_provider_name?.trim()) {
      rescheduleUpdate.assigned_provider = new_provider_name.trim()
      rescheduleUpdate.assigned_volunteer = new_provider_name.trim()
    }
    updates.booking_details = rescheduleUpdate
  }

  if (dispatch_type && dispatch_details) {
    const existingDetails = (booking.booking_details as Record<string, unknown>) ?? {}
    updates.booking_details = { ...existingDetails, dispatch_type, ...dispatch_details }
    // Stub logs for specific dispatch types
    if (dispatch_type === 'lyft') {
      console.log(`[STUB][Transport] Would dispatch Lyft Healthcare for member ${booking.member_id}: ${(existingDetails.pickup_address as string) ?? 'N/A'} → ${(existingDetails.destination as string) ?? 'N/A'}`)
    } else if (dispatch_type === 'meal_partner') {
      console.log(`[STUB][Meals] Would order from meal partner for member ${booking.member_id}`)
    } else if (['volunteer_driver', 'volunteer_tech', 'volunteer_meals'].includes(dispatch_type)) {
      console.log(`[STUB][Dispatch] Would notify volunteer "${dispatch_details.assigned_volunteer ?? 'N/A'}" for member ${booking.member_id}`)
    } else if (['vetted_provider', 'scheduled_visit'].includes(dispatch_type)) {
      console.log(`[STUB][Dispatch] Would notify provider "${dispatch_details.assigned_provider ?? 'N/A'}" for member ${booking.member_id}`)
    } else if (['inHome_visit', 'remote_call'].includes(dispatch_type)) {
      console.log(`[STUB][Dispatch] Would schedule ${dispatch_type} for member ${booking.member_id} at ${dispatch_details.scheduled_time ?? 'N/A'}`)
    }
  }

  const { error: updateErr } = await admin
    .from('service_bookings')
    .update(updates as never)
    .eq('id', bookingId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Push Realtime notification based on action and status
  const serviceLabel: Record<string, string> = {
    transport: 'Transport',
    home_service: 'Home Services',
    meals: 'Meals',
    telehealth: 'Health Services',
    legal_financial: 'Legal & Financial',
    tech_help: 'Tech Help',
    companionship: 'Companionship & Social',
  }
  const label = serviceLabel[booking.service_type] ?? booking.service_type

  if (action === 'unschedule') {
    await pushRealtimeNotification({
      type: 'service_booking_update',
      memberId: booking.member_id as string,
      title: `${label} schedule cleared`,
      body: `Your ${label.toLowerCase()} scheduling has been cleared. Your navigator will contact you to reschedule.`,
      severity: 'info',
    })
  } else if (action === 'reschedule' && scheduled_time) {
    const timeLabel = new Date(scheduled_time).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
    const providerNote = new_provider_name?.trim() ? ` with ${new_provider_name.trim()}` : ''
    await pushRealtimeNotification({
      type: 'service_booking_update',
      memberId: booking.member_id as string,
      title: `${label} rescheduled`,
      body: `Your ${label.toLowerCase()} has been rescheduled to ${timeLabel}${providerNote}.`,
      severity: 'info',
    })
  } else if (targetStatus === 'confirmed' && action === 'reassign') {
    const newName = dispatch_details?.assigned_volunteer || dispatch_details?.assigned_provider || null
    const scheduledTimeStr = dispatch_details?.scheduled_time
    const timeLabel = scheduledTimeStr
      ? new Date(scheduledTimeStr).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
      : null
    await pushRealtimeNotification({
      type: 'service_booking_update',
      memberId: booking.member_id as string,
      title: `${label} reassigned`,
      body: `Your ${label.toLowerCase()} has been reassigned${newName ? ` to ${newName}` : ''}${timeLabel ? ` — still scheduled for ${timeLabel}` : ''}.`,
      severity: 'info',
    })
  } else if (targetStatus === 'confirmed' || targetStatus === 'completed') {
    const scheduledTimeStr = dispatch_details?.scheduled_time || scheduled_time
    const timeLabel = scheduledTimeStr
      ? new Date(scheduledTimeStr).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
      : booking.requested_for
        ? new Date(booking.requested_for as string).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
        : null
    const title = targetStatus === 'confirmed' ? `${label} request confirmed` : `${label} service completed`
    const body_text = targetStatus === 'confirmed'
      ? `Your ${label.toLowerCase()} request has been confirmed${timeLabel ? ` for ${timeLabel}` : ''}.`
      : `Your ${label.toLowerCase()} service has been marked as completed.`
    await pushRealtimeNotification({
      type: 'service_booking_update',
      memberId: booking.member_id as string,
      title,
      body: body_text,
      severity: 'info',
    })
  } else if (targetStatus === 'cancelled') {
    const reason = cancel_reason ? ` Reason: ${cancel_reason}.` : ''
    await pushRealtimeNotification({
      type: 'service_booking_update',
      memberId: booking.member_id as string,
      title: `${label} request cancelled`,
      body: `Your ${label.toLowerCase()} request has been cancelled.${reason} Please contact your navigator if you need to rebook.`,
      severity: 'info',
    })
  }

  // Return the updated booking
  const { data: updated } = await admin
    .from('service_bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle()

  return NextResponse.json({ booking: updated })
}

// Member-initiated cancellation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const { cancel_reason } = body as { cancel_reason?: string }

  const admin = createAdminClient()

  const { data: booking, error: fetchErr } = await admin
    .from('service_bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('member_id', fm.member_id)
    .maybeSingle()

  if (fetchErr || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (['completed', 'cancelled'].includes(booking.status as string)) {
    return NextResponse.json({ error: 'This booking cannot be cancelled.' }, { status: 400 })
  }

  if (booking.status === 'in_progress') {
    return NextResponse.json({ error: 'Cannot cancel a service in progress. Please contact your navigator.' }, { status: 400 })
  }

  // For confirmed bookings, block if within 4 hours of scheduled time
  if (booking.status === 'confirmed') {
    const d = (booking.booking_details ?? {}) as Record<string, string>
    const scheduledTime = d.scheduled_time ?? d.date_time ?? d.preferred_time ?? (booking.requested_for as string | undefined)
    if (scheduledTime) {
      const hoursUntil = (new Date(scheduledTime).getTime() - Date.now()) / (1000 * 60 * 60)
      if (hoursUntil < 4) {
        return NextResponse.json({
          error: 'Your service is confirmed and less than 4 hours away. Please contact your navigator to cancel.',
        }, { status: 400 })
      }
    }
  }

  const noteText = cancel_reason?.trim()
    ? `[Member cancelled] ${cancel_reason.trim()}`
    : '[Member cancelled their request]'

  const { error: updateErr } = await admin
    .from('service_bookings')
    .update({ status: 'cancelled', notes: noteText })
    .eq('id', bookingId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
