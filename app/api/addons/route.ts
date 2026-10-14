// app/api/addons/route.ts
// G7.23 — Premium add-on SKUs
// GET  — list available SKUs + member's active add-ons
// POST — purchase/activate add-on (Stripe integration stub)
// PATCH — cancel add-on

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const memberId = url.searchParams.get('memberId')

  const admin = createAdminClient()

  // Always return all active SKUs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: skus, error: skuErr } = await (admin as any)
    .from('addon_skus')
    .select('*')
    .eq('is_active', true)
    .order('price_cents')
  if (skuErr) return NextResponse.json({ error: skuErr.message }, { status: 500 })

  let memberAddons = null
  if (memberId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .from('member_addons')
      .select('*, sku_detail:addon_skus(name, billing_interval, price_cents)')
      .eq('member_id', memberId)
      .eq('status', 'active')
    memberAddons = data ?? []
  }

  return NextResponse.json({ skus: skus ?? [], memberAddons })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { memberId, sku, quantity = 1, stripePaymentId } = body

  if (!memberId || !sku) return NextResponse.json({ error: 'memberId and sku required' }, { status: 400 })

  // Family member can purchase for their linked member; staff can purchase for any
  const isFamily = fm.member_id === memberId
  const isStaff = ['staff', 'admin'].includes((fm as any).role)
  if (!isFamily && !isStaff) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: skuRow } = await (admin as any)
    .from('addon_skus')
    .select('*')
    .eq('slug', sku)
    .eq('is_active', true)
    .maybeSingle()
  if (!skuRow) return NextResponse.json({ error: 'SKU not found or inactive' }, { status: 404 })

  // For monthly billing: check not already active
  if (skuRow.billing_interval === 'month') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (admin as any)
      .from('member_addons')
      .select('id')
      .eq('member_id', memberId)
      .eq('sku', sku)
      .eq('status', 'active')
      .maybeSingle()
    if (existing) return NextResponse.json({ error: 'Add-on already active' }, { status: 409 })
  }

  // Calculate paid_through_date
  let paidThrough: string | null = null
  if (skuRow.billing_interval === 'month') {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    paidThrough = d.toISOString().split('T')[0]
  } else if (skuRow.billing_interval === 'one_time') {
    paidThrough = null // no expiry for one-time
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: addon, error } = await (admin as any)
    .from('member_addons')
    .insert({
      member_id: memberId,
      sku,
      quantity,
      status: 'active',
      stripe_payment_id: stripePaymentId ?? null,
      paid_through_date: paidThrough,
      requested_by: fm.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // For navigator_hour: create navigator task
  if (sku === 'navigator_hour') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('navigator_tasks').insert({
      member_id: memberId,
      task_type: 'navigator_hour_purchased',
      priority: 'medium',
      description: `Family purchased ${quantity} navigator hour(s). Schedule and coordinate with member.`,
      metadata: { addon_id: addon.id, quantity },
    }).catch(() => null)
  }

  const totalCents = skuRow.price_cents * quantity
  const response: Record<string, unknown> = {
    ok: true,
    addonId: addon.id,
    sku,
    quantity,
    totalCents,
    paidThrough,
  }

  if (!stripePaymentId) {
    response.note = 'Payment integration pending Stripe live keys. Add-on activated for testing.'
  }

  return NextResponse.json(response, { status: 201 })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { addonId } = body
  if (!addonId) return NextResponse.json({ error: 'addonId required' }, { status: 400 })

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('member_addons')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', addonId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
