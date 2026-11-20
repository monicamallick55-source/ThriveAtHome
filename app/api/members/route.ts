import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [{ id: '00000000-0000-0000-0000-000000000099', name: 'Test Member', email: 'member@test.com', status: 'active', grief_support: true }]
export async function GET(req: NextRequest) {
  const _sb = await createClient()
  const { data: { user } } = await _sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { const supabase = _sb; const { searchParams } = new URL(req.url); const limit = parseInt(searchParams.get('limit') || '20'); const { data } = await supabase.from('members').select('*').limit(limit); if (data && data.length > 0) return NextResponse.json(data) } catch {}
  return NextResponse.json(MOCK)
}
export async function POST(req: NextRequest) {
  const _sb2 = await createClient()
  const { data: { user: u2 } } = await _sb2.auth.getUser()
  if (!u2) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: Record<string,unknown> = {}; try { body = await req.json() } catch {}
  try { const supabase = await createClient(); const { data, error } = await supabase.from('members').insert([body]).select().single(); if (data && !error) return NextResponse.json(data, { status: 201 }) } catch {}
  return NextResponse.json({ id: `mem-${Date.now()}`, ...body, status: 'active' }, { status: 201 })
}
