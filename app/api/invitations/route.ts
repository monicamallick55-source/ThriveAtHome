// app/api/invitations/route.ts
// G5.7 — Family invitations with plan seat-limit enforcement

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Plan seat limits per tier slug
const SEAT_LIMITS: Record<string, number> = {
  essential: 3,
  standard:  5,
  premium:   8,
}
const DEFAULT_SEATS = 3

async function getSeatLimit(memberId: string): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data } = await admin
    .from('member_plans')
    .select('plans:plan_id(slug)')
    .eq('member_id', memberId)
    .eq('status', 'active')
    .maybeSingle()
  if (!data?.plans?.slug) return DEFAULT_SEATS
  return SEAT_LIMITS[data.plans.slug as string] ?? DEFAULT_SEATS
}

// GET /api/invitations — list invitations for the current member's circle
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const { data: isStaff } = await supabase.rpc('is_staff')

  let memberId: string | null = null
  if (isStaff) {
    // Staff: no member filter (they'll pass ?member_id= from the query)
  } else if (fm?.member_id) {
    memberId = fm.member_id as string
  } else {
    return NextResponse.json({ error: 'No member context' }, { status: 403 })
  }

  let query = admin
    .from('family_invitations')
    .select('*')
    .order('created_at', { ascending: false })

  if (memberId) query = query.eq('member_id', memberId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invitations: data ?? [] })
}

// POST /api/invitations — send a new family invitation (enforces seat limit)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const { data: isStaff } = await supabase.rpc('is_staff')

  const body = await request.json() as { member_id?: string; email?: string; role?: string }
  const memberId: string = (isStaff ? body.member_id : fm?.member_id) as string
  if (!memberId) return NextResponse.json({ error: 'No member context' }, { status: 403 })

  const email = body.email?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })
  const role = body.role ?? 'family'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Count current accepted family members (not counting the primary member themselves)
  const { count: acceptedCount } = await admin
    .from('family_members')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .neq('supabase_auth_id', null) // only accounts that actually signed up

  // Count pending invitations (not expired, not revoked)
  const { count: pendingCount } = await admin
    .from('family_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())

  const totalSeatsUsed = (acceptedCount ?? 0) + (pendingCount ?? 0)
  const seatLimit = await getSeatLimit(memberId)

  if (totalSeatsUsed >= seatLimit) {
    return NextResponse.json(
      {
        error: `Your plan allows up to ${seatLimit} family member${seatLimit === 1 ? '' : 's'}. You've reached that limit.`,
        code: 'seat_limit_reached',
        limit: seatLimit,
        used: totalSeatsUsed,
        upgrade_hint: 'Upgrade your plan to add more family members.',
      },
      { status: 403 }
    )
  }

  // Create the invitation
  const { data: invitation, error } = await admin
    .from('family_invitations')
    .insert({
      member_id: memberId,
      invited_by: fm?.id,
      email,
      role,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'An invitation for that email already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: send invitation email via SendGrid when SENDGRID_API_KEY is set
  // For now, log the token so staff can share it manually
  console.log(`[invitations] token for ${email}: ${invitation.token}`)

  return NextResponse.json({ invitation }, { status: 201 })
}
