// app/api/ride-bookings/[id]/route.ts
// PATCH — update status / driver info / cancel
// DELETE — hard delete (staff only)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data: isStaff } = await supabase.rpc('is_staff')

  const updates: Record<string, unknown> = {}

  if (isStaff) {
    // Staff can update anything
    if (body.status !== undefined) updates.status = body.status
    if (body.driver_name !== undefined) updates.driver_name = body.driver_name
    if (body.driver_phone !== undefined) updates.driver_phone = body.driver_phone
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.pickup_address !== undefined) updates.pickup_address = body.pickup_address
    if (body.dropoff_address !== undefined) updates.dropoff_address = body.dropoff_address
    if (body.pickup_time !== undefined) updates.pickup_time = body.pickup_time
    if (body.status === 'confirmed') updates.confirmed_at = new Date().toISOString()
    if (body.status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString()
      if (body.cancel_reason) updates.cancel_reason = body.cancel_reason
    }
  } else {
    // Non-staff can only cancel their own
    if (body.status === 'cancelled') {
      // Verify ownership
      const { data: booking } = await admin
        .from('ride_bookings')
        .select('requested_by, member_id, status')
        .eq('id', id)
        .maybeSingle()

      const { data: fm } = await supabase
        .from('family_members')
        .select('id, member_id')
        .eq('supabase_auth_id', user.id)
        .maybeSingle()

      const canCancel =
        fm && (booking?.requested_by === fm.id || booking?.member_id === fm.member_id)
        && ['requested', 'confirmed'].includes(booking?.status)

      if (!canCancel) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

      updates.status = 'cancelled'
      updates.cancelled_at = new Date().toISOString()
      if (body.cancel_reason) updates.cancel_reason = body.cancel_reason
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { data, error } = await admin
    .from('ride_bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify member on status changes
  if (updates.status === 'confirmed' || updates.status === 'cancelled') {
    const title = updates.status === 'confirmed' ? '🚗 Ride Confirmed' : '🚗 Ride Cancelled'
    const body_text = updates.status === 'confirmed'
      ? `Your ride is confirmed${data.driver_name ? ` with ${data.driver_name}` : ''}.`
      : `Your ride has been cancelled${data.cancel_reason ? `: ${data.cancel_reason}` : '.'}`

    await admin.from('realtime_notifications').insert({
      type: `ride_${updates.status}`,
      title,
      body: body_text,
      severity: updates.status === 'confirmed' ? 'success' : 'warning',
      member_id: data.member_id,
    }).catch(() => null)
  }

  return NextResponse.json({ booking: data })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { error } = await admin.from('ride_bookings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
