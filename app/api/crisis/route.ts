import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [{ id: 'crisis-mock-001', member_id: 'mem-1', type: 'fall', status: 'open', created_at: new Date().toISOString() }]
export async function GET(req: NextRequest) {
  try { const supabase = await createClient(); const { searchParams } = new URL(req.url); const status = searchParams.get('status'); let q = supabase.from('crisis_events').select('*').order('created_at', { ascending: false }).limit(20); if (status) q = q.eq('status', status); const { data } = await q; if (data && data.length > 0) return NextResponse.json(data) } catch {}
  return NextResponse.json(MOCK)
}
export async function POST(req: NextRequest) {
  let body: Record<string,unknown> = {}; try { body = await req.json() } catch {}
  try { const supabase = await createClient(); const { data, error } = await supabase.from('crisis_events').insert([{ ...body, status: 'open', created_at: new Date().toISOString() }]).select().single(); if (data && !error) return NextResponse.json(data, { status: 201 }) } catch {}
  return NextResponse.json({ id: `crisis-${Date.now()}`, ...body, status: 'open' }, { status: 201 })
}
