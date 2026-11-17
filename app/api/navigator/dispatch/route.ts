import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MOCK_DISPATCH = { id: 'dispatch-mock-001', status: 'assigned' }

export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { booking_id, volunteer_id } = body
  if (!booking_id || !volunteer_id) return NextResponse.json({ error: 'booking_id and volunteer_id required' }, { status: 400 })
  const { data, error } = await supabase.from('service_bookings')
    .update({ status: 'confirmed', navigator_id: user.id })
    .eq('id', booking_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, volunteer_id, status: 'assigned' })
}
