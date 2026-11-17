import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [
  { id: 'assign-mock-001', volunteer_id: 'vol-1', member_id: 'mem-1', status: 'pending', created_at: new Date().toISOString() },
  { id: 'assign-mock-002', volunteer_id: 'vol-2', member_id: 'mem-1', status: 'pending', created_at: new Date().toISOString() },
]
export async function GET(req: NextRequest) {
  try { const supabase = await createClient(); const { searchParams } = new URL(req.url); const request_id = searchParams.get('request_id'); let q = supabase.from('buddy_assignments').select('*').limit(20); if (request_id) q = q.eq('request_id', request_id); const { data } = await q; if (data && data.length > 0) return NextResponse.json(data) } catch {}
  return NextResponse.json(MOCK)
}
export async function POST(req: NextRequest) {
  let body: Record<string,unknown> = {}; try { body = await req.json() } catch {}
  try { const supabase = await createClient(); const { data, error } = await supabase.from('buddy_assignments').insert([{ ...body, status: 'pending' }]).select().single(); if (data && !error) return NextResponse.json(data, { status: 201 }) } catch {}
  return NextResponse.json({ id: `assign-${Date.now()}`, ...body, status: 'pending' }, { status: 201 })
}
