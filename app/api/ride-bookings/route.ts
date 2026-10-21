// app/api/ride-bookings/route.ts
// GET  — list ride bookings (staff: all; member/family: own)
// POST — request a new ride

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')
  const status = searchParams.get('status')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any as any

  const { data: isStaff } = await supabase.rpc('is_staff')

  let query = admin
    .from('ride_bookings')
    .select(`
      id, created_at, updated_at, member_id, event_id,
      requested_by, pickup_address, dropoff_address, pickup_time,
      notes, status, driver_name, driver_phone,
      confirmed_at, cancelled_at, cancel_reason,
      members:member_id(id, full_name, preferred_name, phone),
      events:event_id(id, title, start_time, location)
    `)
    .order('pickup_time', { ascending: true })

  if (!isStaff) {
    // Non-staff: get their family_member id and filter
    const { data: fm } = await supabase
      .from('family_members')
      .select('id, member_id')
      .eq('supabase_auth_id', user.id)
      .maybeSingle()

    if (!fm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (fm.member_id) {
      query = query.eq('member_id', fm.member_id)
    } else {
      query = query.eq('requested_by', fm.id)
    }
  } else if (memberId) {
    query = query.eq('member_id', memberId)
  }

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bookings: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { member_id, event_id, pickup_address, dropoff_address, pickup_time, notes } = body as {
    member_id?: string; event_id?: string
    pickup_address?: string; dropoff_address?: string
    pickup_time?: string; notes?: string
  }

  if (!member_id || !pickup_time) {
    return NextResponse.json({ error: 'member_id and pickup_time required' }, { status: 400 })
  }

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const { data: isStaff } = await supabase.rpc('is_staff')

  // Non-staff can only book for their own member
  if (!isStaff && fm?.member_id !== member_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any as any

  const { data: booking, error } = await db
    .from('ride_bookings')
    .insert({
      member_id,
      event_id: event_id ?? null,
      requested_by: fm?.id ?? null,
      pickup_address: pickup_address ?? null,
      dropoff_address: dropoff_address ?? null,
      pickup_time,
      notes: notes ?? null,
      status: 'requested',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify navigator
  await db.from('realtime_notifications').insert({
    type: 'ride_requested',
    title: '🚗 Ride Requested',
    body: `A ride has been requested for ${new Date(pickup_time).toLocaleString()}.`,
    severity: 'info',
    member_id,
  }).catch(() => null)

  return NextResponse.json({ booking }, { status: 201 })
}
