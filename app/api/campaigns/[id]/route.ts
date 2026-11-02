import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = createAdminClient()
  const { data, error } = await (admin as any).from('member_campaigns')
    .select(`*, members!inner(id, first_name, last_name), campaign_donations(id, amount, donor_name, message, is_anonymous, created_at)`)
    .eq('id', (await params).id).single()
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await (admin as any).from('staff').select('id, role').eq('supabase_auth_id', user.id).single()
  const body = await req.json()
  const { action, rejection_reason } = body

  if (staff && ['approve','reject'].includes(action)) {
    if (action === 'reject') {
      await (admin as any).from('member_campaigns').update({ status: 'rejected', rejection_reason: rejection_reason || 'Does not meet campaign guidelines.', reviewed_by: staff.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', (await params).id)
      return NextResponse.json({ status: 'rejected' })
    }
    const { data: campaign } = await (admin as any).from('member_campaigns').select('title, goal_amount').eq('id', (await params).id).single()
    let paymentLinkUrl: string | null = null, paymentLinkId: string | null = null
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
      const price = await stripe.prices.create({ currency: 'usd', custom_unit_amount: { enabled: true, minimum: 100, preset: 1000 }, product_data: { name: `Donate to: ${campaign.title}` } })
      const link = await stripe.paymentLinks.create({ line_items: [{ price: price.id, quantity: 1 }], after_completion: { type: 'redirect', redirect: { url: `${process.env.NEXT_PUBLIC_APP_URL}/campaigns/${(await params).id}?donated=true` } }, metadata: { campaign_id: (await params).id } })
      paymentLinkUrl = link.url; paymentLinkId = link.id
    } catch(e) { console.error('Stripe link error:', e) }
    await (admin as any).from('member_campaigns').update({ status: 'active', stripe_payment_link_id: paymentLinkId, stripe_payment_link_url: paymentLinkUrl, reviewed_by: staff.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', (await params).id)
    return NextResponse.json({ status: 'active', payment_link_url: paymentLinkUrl })
  }

  const { data: member } = await (admin as any).from('members').select('id').eq('supabase_auth_id', user.id).single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data: campaign } = await (admin as any).from('member_campaigns').select('member_id, status').eq('id', (await params).id).single()
  if (!campaign || campaign.member_id !== member.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (campaign.status !== 'pending_review') return NextResponse.json({ error: 'Can only edit pending_review campaigns' }, { status: 400 })
  const allowed = ['title','description','end_date','cover_image_url']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) if (body[key] !== undefined) updates[key] = body[key]
  await (admin as any).from('member_campaigns').update(updates).eq('id', (await params).id)
  return NextResponse.json({ updated: true })
}
