// app/api/advisor-listings/route.ts
// G7.21 — Paid advisor directory listings with Stripe subscription
// POST — advisor submits listing application
// GET  — admin views pending listings
// PATCH — admin approves/rejects listing

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TIER_FEES: Record<string, number> = {
  basic: 240000,    // $2,400/yr
  featured: 360000, // $3,600/yr
  premier: 600000,  // $6,000/yr
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || !['staff', 'admin'].includes((fm as any).role)) {
    return NextResponse.json({ error: 'Staff only' }, { status: 403 })
  }

  const url = new URL(req.url)
  const statusFilter = url.searchParams.get('status') ?? 'pending_approval'

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('trusted_advisor_listings')
    .select('*, advisor:trusted_advisors(id, name, category, specialty, email, phone)')
    .eq('status', statusFilter)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ listings: data })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { advisorId, tier, stripeSubId } = body

  if (!advisorId || !tier) {
    return NextResponse.json({ error: 'advisorId and tier required' }, { status: 400 })
  }
  if (!TIER_FEES[tier]) {
    return NextResponse.json({ error: `tier must be: ${Object.keys(TIER_FEES).join(', ')}` }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify advisor exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: advisor } = await (admin as any)
    .from('trusted_advisors')
    .select('id, name, category')
    .eq('id', advisorId)
    .maybeSingle()
  if (!advisor) return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })

  // Check no active/pending listing already
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from('trusted_advisor_listings')
    .select('id, status')
    .eq('trusted_advisor_id', advisorId)
    .in('status', ['pending_approval', 'active'])
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: `Listing already exists with status: ${existing.status}` }, { status: 409 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing, error } = await (admin as any)
    .from('trusted_advisor_listings')
    .insert({
      trusted_advisor_id: advisorId,
      listing_tier: tier,
      annual_fee_cents: TIER_FEES[tier],
      stripe_sub_id: stripeSubId ?? null,
      status: 'pending_approval',
      // paid_through_date set after payment confirmed
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create admin task for review
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('navigator_tasks').insert({
    task_type: 'listing_review',
    priority: 'medium',
    description: `New ${tier} listing application from ${advisor.name} (${advisor.category}). Annual fee: $${(TIER_FEES[tier] / 100).toLocaleString()}.`,
    metadata: { listing_id: listing.id, advisor_id: advisorId, tier, annual_fee_cents: TIER_FEES[tier] },
  }).catch(() => null)

  return NextResponse.json({
    ok: true,
    listingId: listing.id,
    tier,
    annualFeeCents: TIER_FEES[tier],
    note: 'Listing pending admin approval. Payment integration requires Stripe live keys.',
  }, { status: 201 })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || !['staff', 'admin'].includes((fm as any).role)) {
    return NextResponse.json({ error: 'Staff only' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { listingId, action } = body
  if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

  const admin = createAdminClient()

  if (action === 'approve') {
    const paidThrough = new Date()
    paidThrough.setFullYear(paidThrough.getFullYear() + 1)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('trusted_advisor_listings')
      .update({
        status: 'active',
        approved_by: fm.id,
        approved_at: new Date().toISOString(),
        paid_through_date: paidThrough.toISOString().split('T')[0],
      })
      .eq('id', listingId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, paidThrough: paidThrough.toISOString().split('T')[0] })
  }

  if (action === 'reject') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('trusted_advisor_listings')
      .update({ status: 'cancelled', rejection_reason: body.reason ?? null })
      .eq('id', listingId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
}
