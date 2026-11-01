import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' as any })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const FEE = 330000
const VALID = ['village_network','senior_center','nonprofit','area_agency_on_aging','faith_community','other']

export async function POST(req: Request) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { orgName, orgType, contactName, contactEmail, contactPhone, city, state, website, orgSize, missionStatement } = body
  if (!orgName || !orgType || !contactName || !contactEmail)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  if (!VALID.includes(orgType))
    return NextResponse.json({ error: 'Invalid org type' }, { status: 400 })
  if (orgType === 'nonprofit')
    return NextResponse.json({ redirect: '/nonprofit-admin' })
  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://thriveathome.app'
  try {
    const customer = await stripe.customers.create({
      name: orgName, email: contactEmail, phone: contactPhone ?? undefined,
      metadata: { org_name: orgName, org_type: orgType, contact_name: contactName, city: city ?? '', state: state ?? '' },
    })
    const session = await stripe.checkout.sessions.create({
      customer: customer.id, mode: 'payment',
      line_items: [{ price_data: { currency: 'usd', unit_amount: FEE, product_data: { name: 'ThriveAtHome Organization Enrollment', description: 'One-time enrollment fee includes platform setup, onboarding support, and first-year access.' } }, quantity: 1 }],
      metadata: { flow: 'org_enrollment', org_name: orgName, org_type: orgType, contact_name: contactName, contact_email: contactEmail, contact_phone: contactPhone ?? '', city: city ?? '', state: state ?? '', website: website ?? '', org_size: orgSize ?? '', mission_statement: (missionStatement ?? '').slice(0, 500) },
      success_url: origin + '/org-enroll/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: origin + '/org-enroll?cancelled=1',
      allow_promotion_codes: true, billing_address_collection: 'required',
    })
    await supabase.from('org_enrollment_payments').insert({ stripe_session_id: session.id, stripe_customer_id: customer.id, amount_cents: FEE, org_name: orgName, contact_name: contactName, contact_email: contactEmail, org_type: orgType, status: 'pending', metadata: { city, state, website, orgSize, missionStatement } })
    return NextResponse.json({ checkoutUrl: session.url })
  } catch (e) {
    console.error('[org-enroll/checkout]', e)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
