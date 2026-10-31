// app/api/org-admin/v2v-referral/route.ts
// V2V (Village-to-Village) Referrals
//
// An org admin refers one of their own members to a different community org
//
// Endpoints:
//   GET  /api/org-admin/v2v-referral  — list referrals for caller's org (sent + received)
//   POST /api/org-admin/v2v-referral  — send a new referral
//   PATCH /api/org-admin/v2v-referral — accept | decline | withdraw | mark-enrolled

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireOrgAdmin(authId: string) {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fm } = await (admin.from as any)('family_members')
    .select('id, role, org_id, full_name')
    .eq('supabase_auth_id', authId)
    .maybeSingle()
  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) {
    return { fm: null, error: 'Forbidden' as const }
  }
  if (!fm.org_id) {
    return { fm: null, error: 'No org linked to your account' as const }
  }
  return { fm, error: null }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { fm, error } = await requireOrgAdmin(user.id)
  if (error || !fm) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 400 })

  const direction = req.nextUrl.searchParams.get('direction')
  const admin = createAdminClient()

  const baseSelect = `
    id, status, urgency, reason, services_needed, status_note,
    created_at, decided_at, enrolled_at,
    from_org_id, to_org_id, member_id,
    members(preferred_name, full_name, city, zip_code),
    from_org:community_orgs!v2v_referrals_from_org_id_fkey(id, org_name),
    to_org:community_orgs!v2v_referrals_to_org_id_fkey(id, org_name)
  `

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin.from as any)('v2v_referrals').select(baseSelect)

  if (direction === 'sent') {
    query = query.eq('from_org_id', fm.org_id)
  } else if (direction === 'received') {
    query = query.eq('to_org_id', fm.org_id)
  } else {
    query = query.or(`from_org_id.eq.${fm.org_id},to_org_id.eq.${fm.org_id}`)
  }

  const { data, error: fetchErr } = await query.order('created_at', { ascending: false })
  if (fetchErr) {
    console.error('[api/org-admin/v2v-referral GET]', fetchErr)
    return NextResponse.json({ error: 'Could not load referrals.' }, { status: 500 })
  }
  return NextResponse.json({ referrals: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { fm, error } = await requireOrgAdmin(user.id)
  if (error || !fm) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 400 })

  const body = await req.json().catch(() => null)
  const { member_id, to_org_id, reason, services_needed, urgency } = body ?? {}

  if (!member_id) return NextResponse.json({ error: 'member_id is required' }, { status: 400 })
  if (!to_org_id)  return NextResponse.json({ error: 'to_org_id is required' }, { status: 400 })
  if (to_org_id === fm.org_id) {
    return NextResponse.json({ error: 'Cannot refer a member to your own org' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify member belongs to caller's org
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (admin.from as any)('org_memberships')
    .select('id')
    .eq('member_id', member_id)
    .eq('org_id', fm.org_id)
    .eq('is_active', true)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json(
      { error: 'Member is not an active member of your org. You can only refer your own members.' },
      { status: 403 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: toOrg } = await (admin.from as any)('community_orgs')
    .select('id, org_name, contact_email')
    .eq('id', to_org_id)
    .maybeSingle()

  if (!toOrg) return NextResponse.json({ error: 'Destination org not found' }, { status: 404 })

  // Check for duplicate active referral
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin.from as any)('v2v_referrals')
    .select('id, status')
    .eq('member_id', member_id)
    .eq('to_org_id', to_org_id)
    .in('status', ['pending', 'accepted'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: `A referral to that org is already ${existing.status}.`, referral_id: existing.id },
      { status: 409 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: referral, error: insertErr } = await (admin.from as any)('v2v_referrals')
    .insert({
      from_org_id:     fm.org_id,
      from_admin_auth: user.id,
      member_id,
      to_org_id,
      reason:          typeof reason === 'string' ? reason.trim().slice(0, 2000) : null,
      services_needed: Array.isArray(services_needed) ? services_needed : [],
      urgency:         ['routine','urgent','emergency'].includes(urgency) ? urgency : 'routine',
      status:          'pending',
    })
    .select('id, status, created_at')
    .maybeSingle()

  if (insertErr) {
    console.error('[api/org-admin/v2v-referral POST]', insertErr)
    return NextResponse.json({ error: 'Could not create referral.' }, { status: 500 })
  }

  console.log(
    `[STUB][Email] Notify ${toOrg.contact_email ?? 'to-org admin'} at ${toOrg.org_name}: ` +
    `"A member has been referred to your org. Review in your admin portal." [id: ${referral?.id}]`
  )

  return NextResponse.json({ referral }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { fm, error } = await requireOrgAdmin(user.id)
  if (error || !fm) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 400 })

  const body = await req.json().catch(() => null)
  const { referral_id, action, note } = body ?? {}

  if (!referral_id) return NextResponse.json({ error: 'referral_id is required' }, { status: 400 })

  const VALID_ACTIONS = ['accept', 'decline', 'withdraw', 'enrol'] as const
  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: `action must be one of: ${VALID_ACTIONS.join(', ')}` }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ref } = await (admin.from as any)('v2v_referrals')
    .select('id, status, from_org_id, to_org_id, member_id')
    .eq('id', referral_id)
    .maybeSingle()

  if (!ref) return NextResponse.json({ error: 'Referral not found' }, { status: 404 })

  if (action === 'withdraw') {
    if (ref.from_org_id !== fm.org_id) return NextResponse.json({ error: 'Only the sending org can withdraw' }, { status: 403 })
    if (ref.status !== 'pending') return NextResponse.json({ error: `Cannot withdraw a '${ref.status}' referral` }, { status: 409 })
  } else if (action === 'accept' || action === 'decline') {
    if (ref.to_org_id !== fm.org_id) return NextResponse.json({ error: 'Only the receiving org can accept or decline' }, { status: 403 })
    if (ref.status !== 'pending') return NextResponse.json({ error: `Cannot ${action} a '${ref.status}' referral` }, { status: 409 })
  } else if (action === 'enrol') {
    if (ref.to_org_id !== fm.org_id) return NextResponse.json({ error: 'Only the receiving org can mark enrolled' }, { status: 403 })
    if (ref.status !== 'accepted') return NextResponse.json({ error: 'Referral must be accepted before marking enrolled' }, { status: 409 })
  }

  const ACTION_TO_STATUS: Record<string, string> = {
    accept: 'accepted', decline: 'declined', withdraw: 'withdrawn', enrol: 'accepted',
  }

  const updatePayload: Record<string, unknown> = { status: ACTION_TO_STATUS[action] }
  if (note && typeof note === 'string') updatePayload.status_note = note.trim().slice(0, 1000)
  if (action === 'accept' || action === 'decline') {
    updatePayload.decided_by_auth = user.id
    updatePayload.decided_at = new Date().toISOString()
  }
  if (action === 'enrol') updatePayload.enrolled_at = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (admin.from as any)('v2v_referrals').update(updatePayload).eq('id', referral_id)
  if (updateErr) {
    console.error('[api/org-admin/v2v-referral PATCH]', updateErr)
    return NextResponse.json({ error: 'Could not update referral.' }, { status: 500 })
  }

  if (action === 'accept') {
    const year = new Date().getFullYear()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: memErr } = await (admin.from as any)('org_memberships').upsert({
      member_id: ref.member_id, org_id: fm.org_id,
      membership_tier: 'standard', is_active: true, membership_year: year,
    }, { onConflict: 'member_id,org_id,membership_year' })
    if (memErr) console.error('[api/org-admin/v2v-referral PATCH] membership upsert failed:', memErr)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (admin.from as any)('community_orgs').select('member_count').eq('id', fm.org_id).maybeSingle()
    if (org) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from as any)('community_orgs').update({ member_count: (org.member_count ?? 0) + 1 }).eq('id', fm.org_id)
    }
    console.log(`[STUB][Email] Notify from-org ${ref.from_org_id}: referral ${referral_id} accepted.`)
  }

  if (action === 'decline') {
    console.log(`[STUB][Email] Notify from-org ${ref.from_org_id}: referral ${referral_id} declined. Note: ${note ?? '(none)'}`)
  }

  return NextResponse.json({ ok: true, action })
}
