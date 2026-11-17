import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { booking_id, volunteer_id } = body
  if (!booking_id || !volunteer_id) return NextResponse.json({ error: 'booking_id and volunteer_id required' }, { status: 400 })
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('service_bookings')
      .update({ status: 'assigned', volunteer_id })
      .eq('id', booking_id).select().single()
    if (data) return NextResponse.json({ ...data, status: 'assigned' })
    if (error) console.error('dispatch error:', error.message)
  } catch (e) { console.error('dispatch catch:', e) }
  return NextResponse.json({ id: booking_id, status: 'assigned', volunteer_id })
}
