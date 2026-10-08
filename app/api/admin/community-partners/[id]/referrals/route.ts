// app/api/admin/community-partners/[id]/referrals/route.ts
// POST — create a referral for a member to a partner (staff only)
// PATCH — update referral outcome (staff only)
//
// NOTE: Uses `as any` on community_partners + partner_referrals queries because
// migration 096 has not yet been applied to this environment; once applied and
// types regenerated (`npx supabase gen types`) these casts can be removed.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveStaffContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || (fm.role !== 'admin' && fm.role !== 'navigator')) return null
  return { familyMemberId: fm.id as string, role: fm.role as string }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: partnerId } = await params
  const supabase = await createClient()
  const staff = await resolveStaffContext(supabase)
  if (!staff) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { memberId, reason } = body as { memberId?: string; reason?: string }

  if (!memberId) return NextResponse.json({ error: 'memberId is required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Verify partner exists and is active
  const { data: partner } = await admin
    .from('community_partners')
    .select('id, name, status')
    .eq('id', partnerId)
    .maybeSingle()

  if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  if (partner.status === 'inactive') {
    return NextResponse.json({ error: 'Partner is inactive' }, { status: 409 })
  }

  // Verify member exists
  const { data: member } = await admin
    .from('members')
    .select('id, preferred_name, full_name')
    .eq('id', memberId)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Insert referral
  const { data: referral, error } = await admin
    .from('partner_referrals')
    .insert({
      partner_id:  partnerId,
      member_id:   memberId,
      referred_by: staff.familyMemberId,
      reason:      reason?.trim() || null,
      status:      'sent',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the member (fire-and-forget)
  const memberName = member.preferred_name ?? member.full_name ?? 'A member'
  admin.from('realtime_notifications').insert({
    member_id: memberId,
    type:      'system_message',
    title:     `We've connected you with ${partner.name}`,
    body:      reason?.trim()
      ? `Your navigator has referred you to ${partner.name}. Reason: ${reason.trim()}`
      : `Your navigator has referred you to ${partner.name}, a community resource that may be helpful to you.`,
    severity:  'info',
  }).then(() => {}) // fire-and-forget; .catch() is not available on PostgrestBuilder

  return NextResponse.json({ referral, memberName, partnerName: partner.name }, { status: 201 })
}

// PATCH — update referral outcome
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: partnerId } = await params
  const supabase = await createClient()
  const staff = await resolveStaffContext(supabase)
  if (!staff) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { referralId, status, outcome_note } = body as {
    referralId?: string
    status?: string
    outcome_note?: string
  }

  if (!referralId) return NextResponse.json({ error: 'referralId is required' }, { status: 400 })

  const validStatuses = ['sent','connected','declined','no_response']
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const update: Record<string, string> = {}
  if (status)       update.status       = status
  if (outcome_note) update.outcome_note = outcome_note.trim()

  const { data, error } = await admin
    .from('partner_referrals')
    .update(update)
    .eq('id', referralId)
    .eq('partner_id', partnerId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
