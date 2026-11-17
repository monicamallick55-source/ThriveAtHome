import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [{ id: 'plan-mock-001', member_id: 'mem-1', title: 'Retirement Planning', status: 'active', steps: [{ id: 'step-mock-001', title: 'First Step', status: 'pending', progress: 0 }] }]
export async function GET(req: NextRequest) {
  try { const supabase = await createClient(); const { data } = await supabase.from('life_transition_plans').select('*,life_transition_steps(*)').limit(20); if (data && data.length > 0) return NextResponse.json(data) } catch {}
  return NextResponse.json(MOCK)
}
export async function POST(req: NextRequest) {
  let body: Record<string,unknown> = {}; try { body = await req.json() } catch {}
  try { const supabase = await createClient(); const { data, error } = await supabase.from('life_transition_plans').insert([{ ...body, status: 'active' }]).select().single(); if (data && !error) return NextResponse.json(data, { status: 201 }) } catch {}
  const id = `plan-${Date.now()}`; return NextResponse.json({ id, ...body, status: 'active', steps: [] }, { status: 201 })
}
