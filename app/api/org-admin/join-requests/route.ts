// Org admin: list and decide member requests to join their community org.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireOrgAdmin(authId: string) {
  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('id, role, org_id, full_name')
    .eq('supabase_auth_id', authId)
    .maybeSingle()
  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) return { fm: null, error: 'Forbidden' as const }
  if (!fm.org_id) return { fm: null, error: 'No org linked to your account' as const }
  return { fm, error: null }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { fm, error } = await requireOrgAdmin(user.id)
  if (error || !fm) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 400 })

  const admin = createAdminClient()
  const { data } = await (admin.from as any)('org_join_requests')
    .select('id, member_id, status, message, requester_name, created_at, members(preferred_name, full_name, city, zip_code)')
    .eq('org_id', fm.org_id)
    .order('created_at', { ascending: false })
  return NextResponse.json({ requests: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { fm, error } = await requireOrgAdmin(user.id)
  if (error || !fm) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 400 })

  const body = await req.json().catch(() => null)
  const requestId = body?.request_id
  const decision = body?.decision
  if (!requestId || (decision !== 'approved' && decision !== 'declined')) {
    return NextResponse.json({ error: 'request_id and decision (approved|declined) required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: reqRow } = await (admin.from as any)('org_join_requests')
    .select('id, member_id, org_id, status')
    .eq('id', requestId)
    .maybeSingle()
  if (!reqRow || reqRow.org_id !== fm.org_id) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  if (reqRow.status !== 'pending') return NextResponse.json({ error: 'Already decided' }, { status: 409 })

  const { error: updErr } = await (admin.from as any)('org_join_requests')
    .update({
      status: decision,
      decided_by_auth: user.id,
      decided_at: new Date().toISOString(),
      decision_note: typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : null,
    })
    .eq('id', requestId)
  if (updErr) return NextResponse.json({ error: 'Could not save decision.' }, { status: 500 })

  if (decision === 'approved') {
    const year = new Date().getFullYear()
    const { error: memErr } = await (admin.from as any)('org_memberships').upsert({
      member_id: reqRow.member_id,
      org_id: fm.org_id,
      membership_tier: 'standard',
      is_active: true,
      membership_year: year,
    }, { onConflict: 'member_id,org_id,membership_year' })
    if (memErr) console.error('[api/org-admin/join-requests] membership upsert failed:', memErr)
    // Increment member_count best-effort.
    const { data: org } = await (admin.from as any)('community_orgs').select('member_count').eq('id', fm.org_id).maybeSingle()
    if (org) {
      await (admin.from as any)('community_orgs').update({ member_count: (org.member_count ?? 0) + 1 }).eq('id', fm.org_id)
    }
  }

  console.log(`[STUB][Email] Would tell the member their request to join was ${decision}.`)
  return NextResponse.json({ ok: true, decision })
}
