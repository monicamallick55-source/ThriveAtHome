import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' as any })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await req.json()
  const { campaign_id, amount_cents, donor_name, donor_email, message, is_anonymous } = body

  if (!campaign_id || !amount_cents || amount_cents < 100) {
    return NextResponse.json({ error: 'campaign_id and amount_cents (min $1) required' }, { status: 400 })
  }

  const db = createAdminClient()
  const { data: campaign } = await db
    .from('member_campaigns' as any)
    .select('id, title, status')
    .eq('id', campaign_id)
    .single()

  if (!campaign || campaign.status !== 'active') {
    return NextResponse.json({ error: 'Campaign not found or not active' }, { status: 404 })
  }

  let donor_member_id: string | null = null
  if (user) {
    const { data: member } = await db
      .from('members' as any)
      .select('id')
      .eq('supabase_auth_id', user.id)
      .single()
    donor_member_id = member?.id ?? null
  }

  const effectiveDonorEmail = donor_email || user?.email || ''
  const effectiveDonorName = is_anonymous ? 'Anonymous' : (donor_name || user?.user_metadata?.full_name || 'Supporter')

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: amount_cents,
        product_data: { name: `Donation: ${campaign.title}` },
      },
      quantity: 1,
    }],
    customer_email: effectiveDonorEmail || undefined,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/campaigns/${campaign_id}?donated=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/campaigns/${campaign_id}`,
    metadata: {
      type: 'campaign_donation',
      campaign_id,
      donor_member_id: donor_member_id ?? '',
      donor_name: effectiveDonorName,
      donor_email: effectiveDonorEmail,
      message: message ?? '',
      is_anonymous: is_anonymous ? 'true' : 'false',
    },
  })

  await db.from('campaign_donations' as any).insert({
    campaign_id,
    donor_member_id,
    amount_cents,
    stripe_session_id: session.id,
    donor_name: effectiveDonorName,
    donor_email: effectiveDonorEmail || null,
    message: message ?? null,
    is_anonymous: is_anonymous ?? false,
    status: 'pending',
  })

  return NextResponse.json({ url: session.url })
}
