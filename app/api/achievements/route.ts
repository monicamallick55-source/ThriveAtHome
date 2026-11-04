/**
 * app/api/achievements/route.ts — G5.4
 * POST: record a member achievement; triggers family highlight + welcome-home flow
 * GET:  list achievements for a member
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const VALID_TYPES = [
  'first_class_taught', 'platform_anniversary', 'home_from_hospital', 'life_document_completed',
]

async function triggerWelcomeHomeFlow(supabase: any, memberId: string, achievementId: string) {
  const now = new Date()
  const buddyCallDue = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  await supabase.from('navigator_tasks').insert({
    member_id: memberId,
    task_type: 'home_from_hospital',
    notes: 'Home from hospital — buddy call within 48 hours. Assign a buddy or check-in call within 48 hours to make sure they\'re settling in well.',
    priority: 'high',
    status: 'pending',
    due_date: buddyCallDue.toISOString().split('T')[0],
    metadata: { achievement_id: achievementId },
  }).then(({ error: _e }: { error: unknown }) => void _e)

  await supabase.from('navigator_tasks').insert({
    member_id: memberId,
    task_type: 'home_from_hospital',
    notes: 'Home from hospital — offer meals delivery. Member is home from hospital. Consider whether a meal delivery service or volunteer meal would help for the first week.',
    priority: 'medium',
    status: 'pending',
    due_date: now.toISOString().split('T')[0],
    metadata: { achievement_id: achievementId },
  }).then(({ error: _e }: { error: unknown }) => void _e)

  // Grace day-3 check-in task
  const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  await supabase.from('navigator_tasks').insert({
    member_id: memberId,
    task_type: 'home_from_hospital',
    notes: 'Day-3 Grace check-in: member returned home from hospital 3 days ago. Schedule a brief check-in call to confirm they are recovering well.',
    priority: 'medium',
    status: 'pending',
    due_date: day3.toISOString().split('T')[0],
    metadata: { achievement_id: achievementId, check_in_day: 3 },
  }).then(({ error: _e }: { error: unknown }) => void _e)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: staff } = await supabase
      .from('members')
      .select('id, org_id, role')
      .eq('user_id', user.id)
      .single()
    if (!staff || !['admin', 'navigator', 'staff'].includes(staff.role)) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    const body = await req.json()
    const { member_id, achievement_type, shared_with_family = true, metadata = {} } = body

    if (!member_id || !achievement_type) {
      return NextResponse.json({ error: 'member_id and achievement_type required' }, { status: 400 })
    }
    if (!VALID_TYPES.includes(achievement_type)) {
      return NextResponse.json({ error: `achievement_type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
    }

    const { data: achievement, error } = await supabase
      .from('member_achievements')
      .insert({
        member_id,
        org_id: staff.org_id,
        achievement_type,
        shared_with_family,
        metadata,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (achievement_type === 'home_from_hospital') {
      await triggerWelcomeHomeFlow(supabase, member_id, achievement.id)
    }

    return NextResponse.json(achievement, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const memberId = url.searchParams.get('member_id')

    let query = supabase
      .from('member_achievements')
      .select('*')
      .order('occurred_at', { ascending: false })

    if (memberId) query = query.eq('member_id', memberId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
