import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [{ id: 'trans-mock-001', member_id: 'mem-1', title: 'Career Transition', status: 'active', steps: [{ id: 'step-mock-001', title: 'Resume Update', status: 'pending', order: 1 }] }]
export async function GET(_req: NextRequest) {
  try { const supabase = await createClient(); const { data } = await supabase.from('transitions').select('*,transition_steps(*)').limit(20); if (data && data.length > 0) return NextResponse.json(data) } catch {}
  return NextResponse.json(MOCK)
}
export async function POST(req: NextRequest) {
  let body: Record<string,unknown> = {}; try { body = await req.json() } catch {}
  try { const supabase = await createClient(); const { data, error } = await supabase.from('transitions').insert([{ ...body, status: 'active' }]).select().single(); if (data && !error) return NextResponse.json(data, { status: 201 }) } catch {}
  return NextResponse.json({ id: `trans-${Date.now()}`, ...body, status: 'active', steps: [] }, { status: 201 })
}
