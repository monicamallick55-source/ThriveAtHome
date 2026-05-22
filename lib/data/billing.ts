// Billing data access — server-side only, uses admin client.
import { createAdminClient } from '../supabase/admin'
import type { Database } from '../../types/database'

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
