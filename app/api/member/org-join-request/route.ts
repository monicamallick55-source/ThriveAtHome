// A member (or their family) requests to join a community org. The org admin decides.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveMember(authId: string): Promise<{ memberId: string | null; name: string | null }> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: direct } = await (admin.from as any)('members')
    .select('id, preferred_name, full_name').eq('supabase_auth_id', authId).maybeSingle()
  if (direct?.id) return { memberId: direct.id, name: direct.preferred_name ?? direct.full_name ?? null }
  const { data: fm } = await admin
    .from('family_members').select('member_id, full_name').eq('supabase_auth_id', authId).maybeSingle()
  return { memberId: fm?.member_id ?? null, name: fm?.full_name ?? null }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMember(user.id)
  if (!memberId) return NextResponse.json({ requests: [] })

  const admin = createAdminClient()
  const { data } = await (admin.from as any)('org_join_requests')
    .select('id, org_id, status, created_at, decision_note, community_orgs(org_name)')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
  return NextResponse.json({ requests: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const orgId = body?.org_id
  if (!orgId) return NextResponse.json({ error: 'org_id is required' }, { status: 400 })

  const { memberId, name } = await resolveMember(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member on file — finish onboarding first.' }, { status: 404 })

  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('org_join_requests')
    .upsert({
      member_id: memberId,
      org_id: orgId,
      requested_by_auth: user.id,
      requester_name: name,
      message: typeof body.message === 'string' ? body.message.trim().slice(0, 1000) : null,
      status: 'pending',
      decided_by_auth: null,
      decided_at: null,
      decision_note: null,
    }, { onConflict: 'member_id,org_id' })
    .select('id, status')
    .maybeSingle()

  if (error) {
    console.error('[api/member/org-join-request POST]', error)
    return NextResponse.json({ error: 'Could not send your request.' }, { status: 500 })
  }

  const { data: org } = await (admin.from as any)('community_orgs').select('contact_email, org_name').eq('id', orgId).maybeSingle()
  console.log(`[STUB][Email] Would notify ${org?.contact_email ?? 'the org admin'} at ${org?.org_name ?? 'the org'}: "${name ?? 'A member'} has requested to join. Review it in your admin portal."`)

  return NextResponse.json({ request: data }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = req.nextUrl.searchParams.get('org_id')
  if (!orgId) return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
  const { memberId } = await resolveMember(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member' }, { status: 404 })

  const admin = createAdminClient()
  const { error } = await (admin.from as any)('org_join_requests')
    .update({ status: 'cancelled' })
    .eq('member_id', memberId).eq('org_id', orgId).eq('status', 'pending')
  if (error) return NextResponse.json({ error: 'Could not cancel.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
