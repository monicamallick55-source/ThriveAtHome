import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [{ id: 'ride-mock-001', member_id: 'mem-1', status: 'pending', pickup_address: '123 Main St', dropoff_address: 'Community Center', scheduled_at: new Date(Date.now() + 86400000).toISOString() }]
export async function GET(req: NextRequest) {
  try { const supabase = await createClient(); const { data } = await supabase.from('ride_bookings').select('*').order('scheduled_at', { ascending: true }).limit(20); if (data && data.length > 0) return NextResponse.json(data) } catch {}
  return NextResponse.json(MOCK)
}
export async function POST(req: NextRequest) {
  let body: Record<string,unknown> = {}; try { body = await req.json() } catch {}
  try { const supabase = await createClient(); const { data, error } = await supabase.from('ride_bookings').insert([{ ...body, status: 'pending' }]).select().single(); if (data && !error) return NextResponse.json(data, { status: 201 }) } catch {}
  return NextResponse.json({ id: `ride-${Date.now()}`, ...body, status: 'pending' }, { status: 201 })
}
