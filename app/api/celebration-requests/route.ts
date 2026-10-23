// app/api/celebration-requests/route.ts
// G7.2 — Family requests a celebration for their senior member
// POST — create a celebration request (basic=free, enhanced=$25, premium=$75)
// GET  — list celebration requests for the current member

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireServerEnv } from '@/lib/env'

function getStripeClient(): Stripe {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (Stripe as any)(requireServerEnv('STRIPE_SECRET_KEY'))
}

const TIER_AMOUNTS: Record<string, number> = {
  basic:    0,
  enhanced: 2500,
  premium:  7500,
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()

  // Could be family_member or member — find member_id either way
  const { data: familyMember } = await (admin as any)
    .from('family_members')
    .select('member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const memberId = familyMember?.member_id ?? member?.id
  if (!memberId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const { data, error } = await (admin as any)
    .from('celebration_requests')
    .select('*')
    .eq('member_id', memberId)
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()

  // Must be a family_member to request a celebration
  const { data: familyMember } = await (admin as any)
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!familyMember) {
    return NextResponse.json(
      { error: 'Only family members can request celebrations' },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { tier, celebrationDate, specialMessage, eventId } = body

  if (!tier || !TIER_AMOUNTS.hasOwnProperty(tier)) {
    return NextResponse.json({ error: 'tier must be basic, enhanced, or premium' }, { status: 400 })
  }
  if (!celebrationDate || typeof celebrationDate !== 'string') {
    return NextResponse.json({ error: 'celebrationDate required (YYYY-MM-DD)' }, { status: 400 })
  }

  const amountCents = TIER_AMOUNTS[tier]

  // Insert as pending
  const { data, error } = await (admin as any)
    .from('celebration_requests')
    .insert({
      member_id:       familyMember.member_id,
      requested_by:    familyMember.id,
      tier,
      amount_cents:    amountCents,
      status:          'pending',
      celebration_date: celebrationDate,
      special_message: typeof specialMessage === 'string' ? specialMessage.slice(0, 500) : null,
      event_id:        eventId ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Basic tier is free — activate immediately
  if (amountCents === 0) {
    await (admin as any)
      .from('celebration_requests')
      .update({ status: 'active' })
      .eq('id', data.id)

    return NextResponse.json(
      { ok: true, requestId: data.id, requiresPayment: false },
      { status: 201 }
    )
  }

  // Paid tier — create Stripe PaymentIntent
  const stripe = getStripeClient()
  const pi = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    metadata: {
      request_id: data.id,
      member_id:  familyMember.member_id,
      tier,
    },
  })

  await (admin as any)
    .from('celebration_requests')
    .update({ stripe_pi_id: pi.id })
    .eq('id', data.id)

  return NextResponse.json({
    ok: true,
    requestId: data.id,
    requiresPayment: true,
    amountCents,
    clientSecret: pi.client_secret,
  }, { status: 201 })
}
