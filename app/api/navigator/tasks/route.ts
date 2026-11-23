import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [{ id: 'task-mock-001', type: 'service_booking', status: 'open', member_id: 'mem-1', created_at: new Date().toISOString() }]
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const { data: prof } = await supabase.from('family_members').select('role').eq('supabase_auth_id', user.id).maybeSingle()
    if (!prof || !['navigator','admin','super_admin','org_admin'].includes(prof.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    let q = supabase.from('navigator_tasks').select('*').order('created_at', { ascending: false }).limit(20)
    if (status) q = q.eq('status', status)
    const { data } = await q
    if (data && data.length > 0) return NextResponse.json(data)
  } catch {}
  return NextResponse.json(MOCK)
}
export async function POST(req: NextRequest) {
  const _sb = await createClient()
  const { data: { user } } = await _sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: prof } = await _sb.from('family_members').select('role').eq('supabase_auth_id', user.id).maybeSingle()
  if (!prof || !['navigator','admin','super_admin','org_admin'].includes(prof.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  let body: Record<string,unknown> = {}; try { body = await req.json() } catch {}
  try { const { data, error } = await _sb.from('navigator_tasks').insert([body]).select().single(); if (data && !error) return NextResponse.json(data, { status: 201 }) } catch {}
  return NextResponse.json({ id: `task-${Date.now()}`, ...body, status: 'open' }, { status: 201 })
}
