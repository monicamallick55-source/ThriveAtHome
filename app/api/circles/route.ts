// app/api/circles/route.ts
// GET  — list all active circles (with member's joined status)
// POST — create a new circle (staff only)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  let query = db
    .from('interest_circles')
    .select('id, name, slug, description, category, member_count, cover_emoji')
    .eq('is_active', true)
    .order('member_count', { ascending: false })

  if (category) query = query.eq('category', category)

  const { data: circles, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If logged in, flag which circles the member has joined
  let joinedIds = new Set<string>()
  if (user) {
    const { data: member } = await db.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle()
    if (member) {
      const { data: memberships } = await db
        .from('circle_memberships')
        .select('circle_id')
        .eq('member_id', member.id)
      joinedIds = new Set((memberships ?? []).map((m: { circle_id: string }) => m.circle_id))
    }
  }

  const enriched = (circles ?? []).map((c: { id: string; [key: string]: unknown }) => ({
    ...c,
    joined: joinedIds.has(c.id),
  }))

  return NextResponse.json({ circles: enriched })
}
