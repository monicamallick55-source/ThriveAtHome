// app/api/upgrade/route.ts
// Basic → Complete plan upgrade via Stripe proration
// Also handles annual ↔ monthly billing cycle switches
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { requireAuth } from '@/lib/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' as any })

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRICE_MAP: Record<string, string | undefined> = {
  basics_monthly:   process.env.STRIPE_PRICE_BASICS_MONTHLY,
  basics_annual:    process.env.STRIPE_PRICE_BASICS_ANNUAL,
  complete_monthly: process.env.STRIPE_PRICE_COMPLETE_MONTHLY,
  complete_annual:  process.env.STRIPE_PRICE_COMPLETE_ANNUAL,
}

export async function POST(req: NextRequest) {
  // Require authenticated user
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { targetPlan, targetBilling } = body as {
    targetPlan?: string
    targetBilling?: string
  }

  if (!targetPlan || !targetBilling) {
    return NextResponse.json({ error: 'targetPlan and targetBilling are required' }, { status: 400 })
  }

  if (!['basics', 'complete'].includes(targetPlan) || !['monthly', 'annual'].includes(targetBilling)) {
    return NextResponse.json({ error: 'Invalid plan or billing' }, { status: 400 })
  }


  // Look up member record
  const { data: member, error: memberError } = await supabaseAdmin
    .from('members')
    .select('id, plan, stripe_subscription_id, stripe_customer_id, subscription_status')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (memberError || !member) {
    return NextResponse.json({ error: 'Member record not found' }, { status: 404 })
  }

  if (member.subscription_status !== 'active') {
    return NextResponse.json({ error: 'No active subscription to upgrade' }, { status: 400 })
  }

  if (!member.stripe_subscription_id) {
    return NextResponse.json({ error: 'No Stripe subscription linked to this account. Contact support.' }, { status: 400 })
  }

  // Prevent downgrade attempts (Basic→Basic or Complete→Basic not allowed here — redirect to cancel)
  if (member.plan === 'complete' && targetPlan === 'basics') {
    return NextResponse.json({ error: 'Downgrading to Basics is not supported via this endpoint. Please contact support.' }, { status: 400 })
  }

  const priceKey = `${targetPlan}_${targetBilling}`
  const newPriceId = PRICE_MAP[priceKey]

  if (!newPriceId) {
    console.error(`[upgrade] Missing env var: STRIPE_PRICE_${priceKey.toUpperCase()}`)
    return NextResponse.json({ error: `Target plan not yet configured (${priceKey}). Please contact support.` }, { status: 503 })
  }

  try {
    // Retrieve current subscription
    const subscription = await stripe.subscriptions.retrieve(member.stripe_subscription_id)
    const currentItemId = subscription.items.data[0]?.id

    if (!currentItemId) {
      return NextResponse.json({ error: 'Cannot determine current subscription item' }, { status: 400 })
    }

    // Update subscription with proration
    // proration_behavior: 'create_prorations' — member gets credit for unused time on old plan
    const updatedSub = await stripe.subscriptions.update(member.stripe_subscription_id, {
      items: [{ id: currentItemId, price: newPriceId }],
      proration_behavior: 'create_prorations',
      metadata: {
        previous_plan: member.plan || 'basics',
        upgraded_to: targetPlan,
        upgraded_at: new Date().toISOString(),
      },
    })

    // Optimistically update the member record
    // (Stripe webhook will also update this, but immediate feedback is better UX)
    await supabaseAdmin
      .from('members')
      .update({
        plan: targetPlan,
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id)

    console.log(`[upgrade] Member ${member.id} upgraded from ${member.plan} → ${targetPlan} (${targetBilling})`)

    return NextResponse.json({
      success: true,
      plan: targetPlan,
      billing: targetBilling,
      subscription_id: updatedSub.id,
      current_period_end: updatedSub
    ,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[upgrade] Stripe error:', message)
    return NextResponse.json({ error: 'Upgrade failed', detail: message }, { status: 500 })
  }
}
