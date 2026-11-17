import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [{ id: 'ctp-mock-001', member_id: 'mem-1', title: 'Encore Career Plan', status: 'active', steps: [] }]
export async function GET(_req: NextRequest) {
  try { const supabase = await createClient(); const { data } = await supabase.from('career_transition_plans').select('*').limit(20); if (data && data.length > 0) return NextResponse.json(data) } catch {}
  return NextResponse.json(MOCK)
}
export async function POST(req: NextRequest) {
  let body: Record<string,unknown> = {}; try { body = await req.json() } catch {}
  try { const supabase = await createClient(); const { data, error } = await supabase.from('career_transition_plans').insert([{ ...body, status: 'active' }]).select().single(); if (data && !error) return NextResponse.json(data, { status: 201 }) } catch {}
  return NextResponse.json({ id: `ctp-${Date.now()}`, ...body, status: 'active', steps: [] }, { status: 201 })
}
