// Billing data access — server-side only, uses admin client.
import { createAdminClient } from '../supabase/admin'
import type { Database } from '../../types/database'
import type { PlanTier } from '../interfaces/BillingProvider'

export type Subscription = Database['public']['Tables']['subscriptions']['Row']

/** Fetch the active subscription for a member. Returns null if no subscription exists. */
export async function getMemberSubscription(
  memberId: string
): Promise<{ data: Subscription | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('subscriptions')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      console.error('[data/billing/getMemberSubscription]', error)
      return { data: null, error: error.message }
    }
    return { data: data as Subscription | null, error: null }
  } catch (e) {
    console.error('[data/billing/getMemberSubscription] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Find a member by their Stripe customer ID (used in webhook processing). */
export async function getMemberByStripeCustomerId(
  stripeCustomerId: string
): Promise<{ data: { id: string; plan_tier: string } | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('subscriptions')
      .select('member_id, plan_tier')
      .eq('stripe_customer_id', stripeCustomerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      console.error('[data/billing/getMemberByStripeCustomerId]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Not found' }
    return { data: { id: data.member_id, plan_tier: data.plan_tier }, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export type UpsertSubscriptionParams = {
  memberId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  planTier: PlanTier
  status: string
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  monthlyAmountCents?: number | null
}

/** Create or update a subscription row and sync member.plan_tier. */
export async function upsertSubscription(
  params: UpsertSubscriptionParams
): Promise<{ data: Subscription | null; error: string | null }> {
  try {
    const admin = createAdminClient()

    // Check if a row already exists for this stripe_subscription_id
    const { data: existing, error: fetchErr } = await admin
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', params.stripeSubscriptionId)
      .maybeSingle()

    if (fetchErr) {
      console.error('[data/billing/upsertSubscription] fetch error:', fetchErr)
      return { data: null, error: fetchErr.message }
    }

    const payload = {
      member_id: params.memberId,
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      plan_tier: params.planTier,
      status: params.status,
      current_period_start: params.currentPeriodStart ?? null,
      current_period_end: params.currentPeriodEnd ?? null,
      monthly_amount_cents: params.monthlyAmountCents ?? null,
    }

    let sub: Subscription | null = null
    if (existing) {
      const { data: updated, error: updateErr } = await admin
        .from('subscriptions')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .maybeSingle()
      if (updateErr) {
        console.error('[data/billing/upsertSubscription] update error:', updateErr)
        return { data: null, error: updateErr.message }
      }
      sub = updated as Subscription | null
    } else {
      const { data: inserted, error: insertErr } = await admin
        .from('subscriptions')
        .insert(payload)
        .select()
        .maybeSingle()
      if (insertErr) {
        console.error('[data/billing/upsertSubscription] insert error:', insertErr)
        return { data: null, error: insertErr.message }
      }
      sub = inserted as Subscription | null
    }

    // Sync member.plan_tier
    const { error: memberErr } = await admin
      .from('members')
      .update({ plan_tier: params.planTier, status: 'active' })
      .eq('id', params.memberId)

    if (memberErr) {
      console.error('[data/billing/upsertSubscription] member update failed:', memberErr)
      // Non-fatal — subscription row is already correct
    }

    return { data: sub, error: null }
  } catch (e) {
    console.error('[data/billing/upsertSubscription] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Mark a subscription cancelled and set member.status to inactive. */
export async function cancelMemberSubscription(
  stripeSubscriptionId: string
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()

    const { data: sub, error: fetchErr } = await admin
      .from('subscriptions')
      .select('member_id')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle()

    if (fetchErr) return { error: fetchErr.message }
    if (!sub) return { error: null } // already gone, no-op

    await admin
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('stripe_subscription_id', stripeSubscriptionId)

    await admin
      .from('members')
      .update({ status: 'inactive' })
      .eq('id', sub.member_id)

    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
