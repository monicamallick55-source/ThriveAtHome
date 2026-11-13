import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const org_id = searchParams.get('org_id')
  if (!org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  const { data: org } = await supabase.from('organizations').select('name, seat_count').eq('id', org_id).single()
  const { count: activeCount } = await supabase.from('org_members').select('*', { count: 'exact', head: true }).eq('org_id', org_id).eq('status', 'active')
  return NextResponse.json({ org_id, org_name: org?.name, total_seats: org?.seat_count || 0, active_members: activeCount || 0, engagement_rate: org?.seat_count ? Math.round(((activeCount || 0) / org.seat_count) * 100) : 0, report_date: new Date().toISOString() })
}
