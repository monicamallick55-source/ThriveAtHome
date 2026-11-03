import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id')
  if (!orgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('members')
    .select(`
      id, full_name, email, plan_tier, status, created_at,
      check_in_calls ( call_date, mood_score )
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const members = (data || []).map((m: any) => {
    const calls: any[] = m.check_in_calls || []
    const moodScores = calls.map((c: any) => c.mood_score).filter((s: any) => s != null)
    const lastCall = calls.sort((a: any, b: any) =>
      new Date(b.call_date).getTime() - new Date(a.call_date).getTime())[0]
    return {
      id: m.id,
      full_name: m.full_name,
      email: m.email,
      plan_tier: m.plan_tier || 'basic',
      status: m.status || 'active',
      joined_at: m.created_at,
      last_check_in: lastCall?.call_date || null,
      mood_avg: moodScores.length
        ? moodScores.reduce((a: number, b: number) => a + b, 0) / moodScores.length
        : null,
    }
  })

  return NextResponse.json(members)
}
