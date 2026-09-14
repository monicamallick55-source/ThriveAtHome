// Volunteer marks a claimed service request complete. This auto-logs the hours to
// the volunteer's service record (volunteer_visits) so they never have to re-enter
// a visit they already did — matching Helpful Village's auto hour logging.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getVolunteerByAuthId, logVolunteerVisit } from '@/lib/data/volunteers'
import { createAdminClient } from '@/lib/supabase/admin'
import type { VisitType } from '@/types/database'

// service_bookings.service_type → volunteer_visits.visit_type
const VISIT_TYPE_MAP: Record<string, VisitType> = {
  phone_call: 'phone_call',
  companionship: 'phone_call',
  companion: 'phone_call',
  in_person_visit: 'in_person_visit',
  transport: 'in_person_visit',
  home_service: 'in_person_visit',
  grocery_help: 'grocery_help',
  meals: 'grocery_help',
  walking_companion: 'walking_companion',
  reading_aloud: 'reading_aloud',
  tech_help: 'tech_help',
  telehealth: 'in_person_visit',
}

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
  const { data: booking } = await admin
    .from('service_bookings')
    .select('id, status, volunteer_id, member_id, service_type, booking_details, requested_for')
    .eq('id', body.booking_id)
    .maybeSingle() as unknown as {
      data: { id: string; status: string; volunteer_id: string | null; member_id: string; service_type: string; booking_details: Record<string, unknown>; requested_for: string | null } | null
    }

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.volunteer_id !== volunteer.id) return NextResponse.json({ error: 'This request is not assigned to you' }, { status: 403 })
  if (booking.status === 'completed') return NextResponse.json({ error: 'Already completed' }, { status: 409 })
  if (booking.status === 'cancelled') return NextResponse.json({ error: 'This request was cancelled' }, { status: 409 })

  const details = (booking.booking_details ?? {}) as Record<string, unknown>
  const durationMinutes = Math.min(
    480,
    Math.max(15, Number(body.duration_minutes ?? details.duration_minutes ?? 60))
  )
  const visitDate = (typeof body.visit_date === 'string' && body.visit_date)
    || (booking.requested_for ? booking.requested_for.slice(0, 10) : new Date().toISOString().slice(0, 10))

  // 1. Mark the booking complete
  const { error: updErr } = await admin
    .from('service_bookings')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      booking_details: { ...details, completed_by_volunteer_id: volunteer.id, hours_auto_logged: durationMinutes / 60 },
    })
    .eq('id', booking.id)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  // 2. Auto-log the hours to the volunteer's service record
  const { error: visitErr } = await logVolunteerVisit({
    volunteer_id: volunteer.id,
    member_id: booking.member_id,
    visit_date: visitDate,
    duration_minutes: durationMinutes,
    visit_type: VISIT_TYPE_MAP[booking.service_type] ?? 'in_person_visit',
    volunteer_notes: typeof body.notes === 'string' && body.notes.trim()
      ? body.notes.trim()
      : 'Auto-logged when the volunteer marked this request complete.',
    volunteer_rating: typeof body.rating === 'number' ? body.rating : undefined,
  })
  if (visitErr) console.error('[api/volunteer/complete-service] visit log failed:', visitErr)

  // 3. Let the member know
  try {
    await admin.from('realtime_notifications').insert({
      member_id: booking.member_id,
      type: 'volunteer_matched' as const,
      severity: 'info' as const,
      title: 'A volunteer completed your request',
      body: 'Your volunteer marked the visit as done. We hope it went well!',
    })
  } catch { /* best-effort */ }

  return NextResponse.json({ success: true, hours_logged: durationMinutes / 60, visit_logged: !visitErr })
}
