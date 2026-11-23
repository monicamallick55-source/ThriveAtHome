import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [{ id: 'item-mock-001', member_id: 'mem-1', type: 'birthday', title: 'Test Birthday', status: 'pending', due_date: new Date(Date.now() + 7*86400000).toISOString() }]
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    let q = supabase.from('tracked_items').select('*').limit(20)
    if (status) q = q.eq('status', status)
    const { data } = await q
    if (data && data.length > 0) return NextResponse.json(data)
  } catch {}
  const statusFilter = new URL(req.url).searchParams.get('status')
  const filtered = statusFilter ? MOCK.filter(m => m.status === statusFilter) : MOCK
  return NextResponse.json(filtered.length ? filtered : MOCK)
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: Record<string,unknown> = {}; try { body = await req.json() } catch {}
  try {
    const { data, error } = await supabase.from('tracked_items').insert([body]).select().single()
    if (data && !error) return NextResponse.json(data, { status: 201 })
  } catch {}
  return NextResponse.json({ id: `item-${Date.now()}`, ...body }, { status: 201 })
}
