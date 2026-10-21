// app/api/plans/route.ts
// GET — list all active plans + add-on SKUs with current member's entitlements

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any as any

  // Plans
  const { data: plans, error: plansErr } = await db
    .from('plans')
    .select('id, name, slug, description, price_cents, billing_interval, entitlements, sort_order')
    .eq('is_active', true)
    .order('sort_order')

  if (plansErr) return NextResponse.json({ error: plansErr.message }, { status: 500 })

  // Add-ons
  const { data: addons } = await db
    .from('addon_skus')
    .select('id, name, slug, description, price_cents, billing_interval, category, requires_plan_slug, entitlement_key, sort_order')
    .eq('is_active', true)
    .order('sort_order')

  // Current member's plan + addons
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  let memberPlan = null
  let memberAddons: unknown[] = []

  if (fm?.member_id) {
    const { data: mp } = await db
      .from('member_plans')
      .select('id, plan_id, status, started_at, trial_ends_at, plans:plan_id(name, slug, entitlements)')
      .eq('member_id', fm.member_id)
      .eq('status', 'active')
      .maybeSingle()

    memberPlan = mp

    const { data: ma } = await db
      .from('member_addons')
      .select('id, addon_id, status, started_at, expires_at, addon_skus:addon_id(name, slug, entitlement_key)')
      .eq('member_id', fm.member_id)
      .eq('status', 'active')

    memberAddons = ma ?? []
  }

  return NextResponse.json({
    plans: plans ?? [],
    addons: addons ?? [],
    member_plan: memberPlan,
    member_addons: memberAddons,
  })
}
