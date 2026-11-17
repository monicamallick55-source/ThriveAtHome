import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [{ id: 'item-mock-001', member_id: 'mem-1', type: 'birthday', title: 'Test Birthday', status: 'pending', due_date: new Date(Date.now() + 7*86400000).toISOString() }]
export async function GET(req: NextRequest) {
  try { const supabase = await createClient(); const { searchParams } = new URL(req.url); const status = searchParams.get('status'); let q = supabase.from('tracked_items').select('*').limit(20); if (status) q = q.eq('status', status); const { data } = await q; if (data && data.length > 0) return NextResponse.json(data) } catch {}
  return NextResponse.json(MOCK)
}
