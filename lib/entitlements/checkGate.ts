/**
 * lib/entitlements/checkGate.ts — G5.7
 * Call inside any API route to enforce plan limits.
 * Returns null if allowed, or a NextResponse 403 if blocked.
 */
import { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { canAccess, getPlanLimits } from './planLimits'

export async function checkFeatureGate(
  supabase: SupabaseClient,
  userId: string,
  feature: string
): Promise<NextResponse | null> {
  const { data: member } = await supabase
    .from('members')
    .select('plan_tier')
    .eq('supabase_auth_id', userId)
    .single()

  const tier = member?.plan_tier ?? 'basics'

  if (!canAccess(tier, feature as any)) {
    const limits = getPlanLimits(tier)
    return NextResponse.json({
      error: 'Plan upgrade required',
      feature,
      current_tier: tier,
      upgrade_url: '/dashboard/addons',
      limits,
    }, { status: 403 })
  }
  return null
}
