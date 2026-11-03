import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/campaigns/[id] — single campaign detail
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin.from('member_campaigns')
    .select(`
      *, members!inner(id, first_name, last_name),
      campaign_donations(id, amount, donor_name, message, is_anonymous, created_at)
    `)
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

// PATCH /api/campaigns/[id] — staff approve/reject or member update
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await admin.from('staff')
    .select('id, role').eq('supabase_auth_id', user.id).single()

  const body = await req.json()
  const { action, rejection_reason } = body

  // Staff actions: approve, reject
  if (staff && ['approve', 'reject'].includes(action)) {
    if (action === 'reject') {
      const { error } = await admin.from('member_campaigns').update({
        status: 'rejected',
        rejection_reason: rejection_reason || 'Does not meet campaign guidelines.',
        reviewed_by: staff.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ status: 'rejected' })
    }

    // approve — create Stripe payment link
    const { data: campaign } = await admin.from('member_campaigns')
      .select('title, goal_amount').eq('id', id).single()

    let paymentLinkUrl: string | null = null
    let paymentLinkId: string | null = null

    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
      // Create a Stripe Price (one-time, custom amount via customer_chooses)
      const price = await stripe.prices.create({
        currency: 'usd',
        custom_unit_amount: { enabled: true, minimum: 100, preset: 1000 },
        product_data: { name: `Donate to: ${campaign.title}` },
      })
      const link = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        after_completion: {
          type: 'redirect',
          redirect: { url: `${process.env.NEXT_PUBLIC_APP_URL}/campaigns/${id}?donated=true` },
        },
        metadata: { campaign_id: id },
      })
      paymentLinkUrl = link.url
      paymentLinkId = link.id
    } catch (e) {
      console.error('Stripe payment link creation failed:', e)
    }

    const { error } = await admin.from('member_campaigns').update({
      status: 'active',
      stripe_payment_link_id: paymentLinkId,
      stripe_payment_link_url: paymentLinkUrl,
      reviewed_by: staff.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ status: 'active', payment_link_url: paymentLinkUrl })
  }

  // Member update (title/description/end_date while pending_review)
  const { data: member } = await admin.from('members')
    .select('id').eq('supabase_auth_id', user.id).single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: campaign } = await admin.from('member_campaigns')
    .select('member_id, status').eq('id', id).single()
  if (!campaign || campaign.member_id !== member.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (campaign.status !== 'pending_review') {
    return NextResponse.json({ error: 'Can only edit campaigns in pending_review status' }, { status: 400 })
  }

  const allowed = ['title', 'description', 'end_date', 'cover_image_url']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { error } = await admin.from('member_campaigns').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ updated: true })
}
