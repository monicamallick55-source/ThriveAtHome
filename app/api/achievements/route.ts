/**
 * app/api/achievements/route.ts — G5.4 Member achievements
 *
 * POST  /api/achievements        — staff/navigator creates an achievement
 * GET   /api/achievements        — member or family views achievements
 * POST  /api/achievements/home-from-hospital — navigator marks member as home from hospital
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')

  let query = supabase
    .from('member_achievements')
    .select('*')
    .order('occurred_at', { ascending: false })

  if (memberId) query = query.eq('member_id', memberId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ achievements: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id, type, occurred_at, metadata, shared_with_family = true } = body

  if (!member_id || !type) {
    return NextResponse.json({ error: 'member_id and type required' }, { status: 400 })
  }

  const { data: achievement, error } = await supabase
    .from('member_achievements')
    .insert({
      member_id,
      type,
      occurred_at: occurred_at ?? new Date().toISOString(),
      shared_with_family,
      metadata: metadata ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Handle home_from_hospital special flow:
  if (type === 'home_from_hospital') {
    await triggerHomeFromHospitalFlow(supabase, member_id, achievement.id)
  }

  // Handle first_class_taught — family highlight
  if (type === 'first_class_taught' && shared_with_family) {
    const className = (metadata as { class_title?: string })?.class_title ?? 'a skill exchange class'
    await notifyFamily(supabase, member_id,
      `Teaching milestone!`,
      `Your family member just taught ${className} — their first time sharing their expertise with the community!`)
  }

  // Handle platform_anniversary
  if (type === 'platform_anniversary') {
    await notifyFamily(supabase, member_id,
      '1-year ThriveAtHome anniversary!',
      'Your family member has been a ThriveAtHome member for one full year. What a journey!')
  }

  return NextResponse.json({ achievement }, { status: 201 })
}

async function triggerHomeFromHospitalFlow(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  memberId: string,
  achievementId: string
) {
  const now = new Date()

  // 1. Buddy call within 48 hours
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

  // 2. Meals offer — navigator task
  await supabase.from('navigator_tasks').insert({
    member_id: memberId,
    task_type: 'home_from_hospital',
    notes: 'Home from hospital — offer meals delivery. Member is home from hospital. Consider whether a meal delivery service or volunteer meal would help for the first week.',
    priority: 'medium',
    status: 'pending',
    due_date: now.toISOString().split('T')[0],
    metadata: { achievement_id: achievementId },
  }).then(({ error: _e }: { error: unknown }) => void _e)

  // 3. Home safety suggestion (G6.1 trigger)
  await supabase.from('navigator_tasks').insert({
    member_id: memberId,
    task_type: 'home_safety',
    notes: 'Home from hospital — suggest home safety assessment. Member returned from hospital — a good time to suggest a home safety assessment (G6.1) if not already enrolled.',
    priority: 'low',
    status: 'pending',
    due_date: now.toISOString().split('T')[0],
    metadata: { achievement_id: achievementId, trigger: 'home_from_hospital' },
  }).then(({ error: _e }: { error: unknown }) => void _e)

  // 4. Grace check-in call on day 3
  const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  await supabase.from('scheduled_calls').insert({
    member_id: memberId,
    call_type: 'grace_checkin',
    scheduled_at: new Date(
      day3.getFullYear(), day3.getMonth(), day3.getDate(), 10, 0, 0
    ).toISOString(),
    reason: 'home_from_hospital',
    metadata: { achievement_id: achievementId },
  }).then(({ error: _e }: { error: unknown }) => void _e)
}

async function notifyFamily(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  memberId: string,
  title: string,
  body: string
) {
  const { data: family } = await supabase
    .from('family_members')
    .select('id')
    .eq('member_id', memberId)

  for (const fm of family ?? []) {
    await supabase.from('notifications').insert({
      user_id: fm.id,
      type: 'member_achievement',
      title,
      body,
      metadata: { member_id: memberId },
      read: false,
    }).then(({ error: _e }: { error: unknown }) => void _e)
  }
}
