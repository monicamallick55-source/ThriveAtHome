// app/api/home-sharing/referrals/route.ts
// GET  — load the current member's referral
// POST — submit a new home sharing referral

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  return fm?.member_id ? fm : null
}

export async function GET() {
  const fm = await resolveUser()
  if (!fm) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: referral } = await (admin as any)
    .from('home_sharing_referrals')
    .select('*')
    .eq('member_id', fm.member_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ referral: referral ?? null })
}

export async function POST(req: Request) {
  const fm = await resolveUser()
  if (!fm) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const {
    role,
    home_description,
    rent_expectation,
    preferred_move_in,
    house_rules,
    budget_description,
    desired_location,
    move_in_by,
    notes,
    consent_shared,
  } = body as Record<string, string | boolean | undefined>

  if (!role || !['host', 'seeker'].includes(role as string)) {
    return NextResponse.json({ error: 'role must be host or seeker' }, { status: 400 })
  }
  if (!consent_shared) {
    return NextResponse.json({ error: 'You must consent to information sharing' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Check for existing active referral
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from('home_sharing_referrals')
    .select('id, status')
    .eq('member_id', fm.member_id)
    .not('status', 'in', '("closed")')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You already have an active home sharing inquiry.', referral: existing }, { status: 409 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: referral, error } = await (admin as any)
    .from('home_sharing_referrals')
    .insert({
      member_id: fm.member_id,
      role,
      home_description: home_description ?? null,
      rent_expectation: rent_expectation ?? null,
      preferred_move_in: preferred_move_in ?? null,
      house_rules: house_rules ?? null,
      budget_description: budget_description ?? null,
      desired_location: desired_location ?? null,
      move_in_by: move_in_by ?? null,
      notes: notes ?? null,
      consent_shared_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ referral }, { status: 201 })
}
