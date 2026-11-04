/**
 * app/api/premium-addons/route.ts — G7.23 Premium Add-On SKUs
 *
 * GET  /api/premium-addons           — list available add-on SKUs
 * POST /api/premium-addons/purchase  — create Stripe Checkout for a SKU
 *
 * SKUs (from migration 095):
 *   family_onboarding_call       $29  — 60-min family onboarding video call with navigator
 *   extra_navigator_hours        $25  — 1 additional navigator hour (can purchase multiple)
 *   companion_credit_bundle      $100 — 10 companion call credits
 *   family_cosigned_birthday_card $9.99 — physical card co-signed by family + navigator
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: addons, error } = await supabase
    .from('premium_addons')
    .select('*')
    .eq('available', true)
    .order('price_cents')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ addons: addons ?? [] })
}
