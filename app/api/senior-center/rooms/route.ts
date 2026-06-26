import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCenterAdmin, createRoomBooking, cancelRoomBooking } from '@/lib/data/seniorCenters'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { center_id, room, booking_title, booked_by, start_time, end_time, notes } = body

    if (!center_id || !room?.trim() || !booking_title?.trim() || !start_time || !end_time) {
      return NextResponse.json({ error: 'center_id, room, booking_title, start_time, and end_time are required' }, { status: 400 })
    }

    const isAdmin = await verifyCenterAdmin(user.id, center_id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await createRoomBooking({
      center_id,
      room: room.trim(),
      booking_title: booking_title.trim(),
      booked_by: booked_by ?? null,
      start_time,
      end_time,
      notes: notes ?? null,
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { booking_id } = body
    if (!booking_id) return NextResponse.json({ error: 'booking_id is required' }, { status: 400 })

    // Verify user has access to this booking's center
    const admin = createAdminClient()
    const { data: booking } = await admin
      .from('room_bookings')
      .select('center_id')
      .eq('id', booking_id)
      .maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isAdmin = await verifyCenterAdmin(user.id, (booking as { center_id: string }).center_id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await cancelRoomBooking(booking_id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
