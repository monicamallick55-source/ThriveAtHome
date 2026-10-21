// app/api/cultural-programming/route.ts
// G7.22 — Festival calendar, potluck coordination, oral history archive

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Festival calendar ─────────────────────────────────────────────────────

export async function GET(req: Request) {
  const url = new URL(req.url)
  const type = url.searchParams.get('type') ?? 'festivals'
  const memberId = url.searchParams.get('memberId')
  const month = url.searchParams.get('month')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  if (type === 'festivals') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (admin as any)
      .from('cultural_festivals')
      .select('*')
      .eq('is_active', true)
      .order('month')
      .order('day')
    if (month) q = q.eq('month', parseInt(month))
    const { data, error } = await q.limit(100)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // If memberId, filter to member's cultural interests too
    if (memberId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: interests } = await (admin as any)
        .from('member_cultural_interests')
        .select('cultural_tag')
        .eq('member_id', memberId)
      const tags = new Set((interests ?? []).map((i: any) => i.cultural_tag))
      const festivals = (data ?? []).map((f: any) => ({ ...f, member_relevant: tags.has(f.cultural_group) }))
      return NextResponse.json({ festivals })
    }
    return NextResponse.json({ festivals: data ?? [] })
  }

  if (type === 'potlucks') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('community_potlucks')
      .select('*')
      .eq('status', 'upcoming')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date')
      .limit(20)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ potlucks: data ?? [] })
  }

  if (type === 'oral_history' && memberId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('oral_history_entries')
      .select('*')
      .eq('member_id', memberId)
      .order('recorded_at', { ascending: false })
      .limit(50)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entries: data ?? [] })
  }

  if (type === 'oral_history_public') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('oral_history_entries')
      .select('id, title, cultural_theme:themes, decade, recorded_at, member_id')
      .eq('is_public', true)
      .not('approved_by', 'is', null)
      .order('recorded_at', { ascending: false })
      .limit(30)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entries: data ?? [] })
  }

  return NextResponse.json({ error: 'type must be: festivals, potlucks, oral_history, oral_history_public' }, { status: 400 })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { type } = body
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  if (type === 'potluck_signup') {
    const { potluckId, dish, dietaryTags } = body
    if (!potluckId || !dish) return NextResponse.json({ error: 'potluckId and dish required' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: potluck } = await (admin as any)
      .from('community_potlucks')
      .select('dish_signups, max_attendees')
      .eq('id', potluckId)
      .maybeSingle()
    if (!potluck) return NextResponse.json({ error: 'Potluck not found' }, { status: 404 })

    const signups = potluck.dish_signups ?? []
    if (potluck.max_attendees && signups.length >= potluck.max_attendees) {
      return NextResponse.json({ error: 'Potluck is full' }, { status: 409 })
    }
    const already = signups.find((s: any) => s.member_id === fm.member_id)
    if (already) return NextResponse.json({ error: 'Already signed up' }, { status: 409 })

    signups.push({ member_id: fm.member_id, dish: dish.slice(0, 100), dietary_tags: dietaryTags ?? [] })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('community_potlucks')
      .update({ dish_signups: signups })
      .eq('id', potluckId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (type === 'oral_history') {
    const { memberId, title, storyText, decade, themes, isPublic } = body
    if (!memberId || !title || !storyText) return NextResponse.json({ error: 'memberId, title, storyText required' }, { status: 400 })

    // Member or staff only
    if (fm.member_id !== memberId && !['staff', 'admin'].includes((fm as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('oral_history_entries')
      .insert({
        member_id: memberId,
        title: title.slice(0, 200),
        story_text: storyText.slice(0, 10000),
        decade: decade ?? null,
        themes: themes ?? [],
        is_public: isPublic ?? false,
        recorded_at: new Date().toISOString().split('T')[0],
      })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, entryId: data.id }, { status: 201 })
  }

  if (type === 'cultural_interest') {
    const { memberId, tag } = body
    if (!memberId || !tag) return NextResponse.json({ error: 'memberId and tag required' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('member_cultural_interests')
      .upsert({ member_id: memberId, cultural_tag: tag }, { onConflict: 'member_id,cultural_tag' })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'type required' }, { status: 400 })
}
