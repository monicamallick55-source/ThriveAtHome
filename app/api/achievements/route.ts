// app/api/achievements/route.ts
// GET  — list achievements for a member (auto-awards tenure milestones)
// POST — award a specific achievement (staff only)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ACHIEVEMENT_MAP, ACHIEVEMENTS } from '@/lib/achievements'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Resolve member_id
  let resolvedMemberId = memberId
  if (!resolvedMemberId) {
    const { data: fm } = await supabase
      .from('family_members')
      .select('member_id')
      .eq('supabase_auth_id', user.id)
      .maybeSingle()
    resolvedMemberId = fm?.member_id ?? null
  }
  if (!resolvedMemberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Auto-award welcome badge if not present
  await admin.from('member_achievements').upsert({
    member_id: resolvedMemberId,
    achievement_key: 'welcome',
    title: ACHIEVEMENT_MAP['welcome'].title,
    description: ACHIEVEMENT_MAP['welcome'].description,
    icon: ACHIEVEMENT_MAP['welcome'].icon,
  }, { onConflict: 'member_id,achievement_key', ignoreDuplicates: true })

  // Auto-award tenure milestones based on member created_at
  const { data: member } = await admin
    .from('members')
    .select('created_at')
    .eq('id', resolvedMemberId)
    .maybeSingle()

  if (member?.created_at) {
    const monthsOld = Math.floor(
      (Date.now() - new Date(member.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    const tenureKeys: string[] = []
    if (monthsOld >= 3) tenureKeys.push('month_3')
    if (monthsOld >= 6) tenureKeys.push('month_6')
    if (monthsOld >= 12) tenureKeys.push('month_12')

    for (const key of tenureKeys) {
      const def = ACHIEVEMENT_MAP[key]
      if (def) {
        await admin.from('member_achievements').upsert({
          member_id: resolvedMemberId,
          achievement_key: key,
          title: def.title,
          description: def.description,
          icon: def.icon,
        }, { onConflict: 'member_id,achievement_key', ignoreDuplicates: true })
      }
    }
  }

  const { data: achievements, error } = await admin
    .from('member_achievements')
    .select('id, achievement_key, title, description, icon, awarded_at')
    .eq('member_id', resolvedMemberId)
    .order('awarded_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Merge with full catalog to show locked achievements too
  const earnedKeys = new Set((achievements ?? []).map((a: { achievement_key: string }) => a.achievement_key))
  const catalog = ACHIEVEMENTS.map(def => ({
    ...def,
    earned: earnedKeys.has(def.key),
    awarded_at: (achievements ?? []).find((a: { achievement_key: string; awarded_at: string }) => a.achievement_key === def.key)?.awarded_at ?? null,
  }))

  return NextResponse.json({ achievements: achievements ?? [], catalog })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { member_id, achievement_key } = body as { member_id?: string; achievement_key?: string }
  if (!member_id || !achievement_key) {
    return NextResponse.json({ error: 'member_id and achievement_key required' }, { status: 400 })
  }

  const def = ACHIEVEMENT_MAP[achievement_key]
  if (!def) return NextResponse.json({ error: 'Unknown achievement' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data, error } = await admin
    .from('member_achievements')
    .upsert({
      member_id,
      achievement_key,
      title: def.title,
      description: def.description,
      icon: def.icon,
    }, { onConflict: 'member_id,achievement_key', ignoreDuplicates: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ achievement: data }, { status: 201 })
}
