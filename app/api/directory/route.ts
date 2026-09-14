// Opt-in member directory (Batch 3, item 5). Members who set directory_opt_in can
// be found by other members of the same community organization(s). GET lists the
// opted-in members the caller is allowed to see, plus the caller's own setting so
// the page can show the toggle. PATCH updates the caller's own opt-in + bio.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveMemberId(authId: string, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: direct } = await (admin.from as any)('members').select('id').eq('supabase_auth_id', authId).maybeSingle()
  if (direct?.id) return direct.id
  const { data: fm } = await admin.from('family_members').select('member_id').eq('supabase_auth_id', authId).maybeSingle()
  return fm?.member_id ?? null
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const memberId = await resolveMemberId(user.id, admin)

  // The caller's own directory setting.
  let me = { opted_in: false, bio: '' as string | null }
  if (memberId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: meRow } = await (admin.from as any)('members')
      .select('directory_opt_in, directory_bio').eq('id', memberId).maybeSingle()
    if (meRow) me = { opted_in: !!meRow.directory_opt_in, bio: meRow.directory_bio ?? '' }
  }

  // The org(s) the caller belongs to.
  const orgIds = new Set<string>()
  if (memberId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: memberships } = await (admin.from as any)('org_memberships')
      .select('org_id').eq('member_id', memberId).eq('is_active', true)
    for (const m of memberships ?? []) orgIds.add(m.org_id)
  }

  let members: Array<Record<string, unknown>> = []
  if (orgIds.size > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sameOrg } = await (admin.from as any)('org_memberships')
      .select('member_id').in('org_id', [...orgIds]).eq('is_active', true)
    const peerIds = [...new Set((sameOrg ?? []).map((r: { member_id: string }) => r.member_id))]
      .filter(id => id !== memberId)

    if (peerIds.length > 0) {
      const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (admin.from as any)('members')
        .select('id, preferred_name, full_name, city, state, directory_bio, topics_enjoy')
        .in('id', peerIds)
        .eq('directory_opt_in', true)
        .order('preferred_name', { ascending: true })
        .limit(200)
      if (q) query = query.or(`preferred_name.ilike.%${q}%,full_name.ilike.%${q}%,city.ilike.%${q}%`)
      const { data } = await query
      members = (data ?? []).map((m: Record<string, unknown>) => ({
        id: m.id,
        name: `${m.preferred_name ?? m.full_name ?? 'A member'}`,
        city: m.city ?? null,
        state: m.state ?? null,
        bio: m.directory_bio ?? null,
        interests: Array.isArray(m.topics_enjoy) ? (m.topics_enjoy as string[]).slice(0, 6) : [],
      }))
    }
  }

  return NextResponse.json({ me, members, in_org: orgIds.size > 0 })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const memberId = await resolveMemberId(user.id, admin)
  if (!memberId) return NextResponse.json({ error: 'No member on file — finish onboarding first.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const updates: Record<string, unknown> = {}
  if (body?.directory_opt_in !== undefined) updates.directory_opt_in = Boolean(body.directory_opt_in)
  if (body?.directory_bio !== undefined) {
    updates.directory_bio = typeof body.directory_bio === 'string' ? body.directory_bio.slice(0, 600) : null
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from as any)('members').update(updates).eq('id', memberId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
