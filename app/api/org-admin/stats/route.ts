import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id')
  if (!orgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  // Fetch org details
  const { data: org } = await supabase
    .from('b2b_orgs')
    .select('org_name, billing_tier, member_count')
    .eq('id', orgId)
    .single()

  // Fetch members
  const { data: members } = await supabase
    .from('members')
    .select('id, status')
    .eq('org_id', orgId)

  const total = members?.length || 0
  const active = members?.filter((m: any) => m.status === 'active').length || 0
  const paused = members?.filter((m: any) => m.status === 'paused').length || 0
  const memberIds = (members || []).map((m: any) => m.id)

  // Avg mood last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const { data: calls } = memberIds.length ? await supabase
    .from('check_in_calls')
    .select('mood_score, call_status')
    .in('member_id', memberIds)
    .gte('call_date', thirtyDaysAgo) : { data: [] }

  const moodScores = (calls || []).map((c: any) => c.mood_score).filter((s: any) => s != null)
  const avgMood = moodScores.length
    ? moodScores.reduce((a: number, b: number) => a + b, 0) / moodScores.length
    : null

  const totalCalls = (calls || []).length
  const completedCalls = (calls || []).filter((c: any) => c.call_status === 'completed').length
  const avgCallCompletion = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : null

  // Alerts this week (critical navigator tasks)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const { count: alertCount } = memberIds.length ? await supabase
    .from('navigator_tasks')
    .select('id', { count: 'exact' })
    .in('member_id', memberIds)
    .eq('priority', 'critical')
    .gte('created_at', weekAgo) : { count: 0 }

  // Monthly cost calculation
  const tier = org?.billing_tier || 'in_development'
  let monthly_cost = 50
  if (tier === 'established') monthly_cost = Math.round(75 + Math.max(0, active - 60) * 1.25)
  if (tier === 'scale') monthly_cost = Math.round(250 + active * 1.0)

  return NextResponse.json({
    org_name: org?.org_name || '',
    total_members: total,
    active_members: active,
    paused_members: paused,
    avg_mood: avgMood,
    avg_call_completion: avgCallCompletion,
    alerts_this_week: alertCount || 0,
    billing_tier: tier,
    monthly_cost,
  })
}
