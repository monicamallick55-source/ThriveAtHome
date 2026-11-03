import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin.from('campaigns')
    .select(`*, campaign_donations(id, amount, donor_name, message, is_anonymous, created_at)`)
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await admin.from('staff')
    .select('id, role').eq('supabase_auth_id', user.id).single()

  const body = await req.json()
  const { action } = body

  if (staff && ['approve', 'reject'].includes(action)) {
    if (action === 'reject') {
      const { error } = await admin.from('campaigns').update({
        status: 'cancelled',
        metadata: { rejection_reason: body.rejection_reason || 'Does not meet campaign guidelines.', reviewed_by: staff.id, reviewed_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ status: 'cancelled' })
    }

    const { data: campaign } = await admin.from('campaigns').select('title, goal_cents').eq('id', id).single()
    let stripeProductId: string | null = null
    let stripePriceId: string | null = null
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
      const product = await stripe.products.create({ name: `Donate to: ${campaign?.title}` })
      const price = await stripe.prices.create({ currency: 'usd', custom_unit_amount: { enabled: true, minimum: 100, preset: 1000 }, product: product.id })
      stripeProductId = product.id
      stripePriceId = price.id
    } catch (e) { console.error('Stripe failed:', e) }

    const { error } = await admin.from('campaigns').update({
      status: 'active',
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      metadata: { reviewed_by: staff.id, reviewed_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ status: 'active' })
  }

  const { data: campaign } = await admin.from('campaigns').select('creator_id, status').eq('id', id).single()
  if (!campaign || campaign.creator_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const allowed = ['title', 'description', 'story', 'ends_at', 'image_url', 'is_public']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) { if (body[key] !== undefined) updates[key] = body[key] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await admin.from('campaigns').update(updates as any).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ updated: true })
}
