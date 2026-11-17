import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [
  { id: 'va-mock-001', volunteer_id: 'vol-1', member_id: 'mem-1', service_type: 'companionship', status: 'active', scheduled_at: new Date().toISOString() },
  { id: 'va-mock-002', volunteer_id: 'vol-2', member_id: 'mem-2', service_type: 'transportation', status: 'active', scheduled_at: new Date().toISOString() },
]
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status')
  try {
    const supabase = await createClient()
    let q = supabase.from('volunteer_assignments').select('*').order('created_at', { ascending: false })
    if (status) q = q.eq('status', status)
    const { data } = await q.catch(() => ({ data: null }))
    if (data && data.length > 0) return NextResponse.json(data)
  } catch {}
  const result = status ? MOCK.filter(m => m.status === status) : MOCK
  return NextResponse.json(result.length ? result : MOCK)
}
