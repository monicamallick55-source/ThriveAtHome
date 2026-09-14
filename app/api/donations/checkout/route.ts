// Donation checkout — hands off to Stripe Checkout in one-time / recurring "donation" mode.
// Only active when STRIPE_SECRET_KEY is set. When Stripe is not configured the route
// returns 501 so the client falls back to recording a pledge via /api/donations.
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret || !secret.trim()) {
    return NextResponse.json({ error: 'Card donations are not enabled yet.' }, { status: 501 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.donor_name?.trim()) return NextResponse.json({ error: 'donor_name required' }, { status: 400 })
  const amountCents = Math.round(Number(body.amount_cents))
  if (!amountCents || amountCents < 100) {
    return NextResponse.json({ error: 'Minimum card donation is $1.00' }, { status: 400 })
  }

  try {
    const Stripe = (await import('stripe')).default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripe = new (Stripe as any)(secret)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const recurring = Boolean(body.is_recurring)

    const session = await stripe.checkout.sessions.create({
      mode: recurring ? 'subscription' : 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: { name: recurring ? 'Monthly donation to ThriveAtHome' : 'Donation to ThriveAtHome' },
            ...(recurring ? { recurring: { interval: 'month' } } : {}),
          },
        },
      ],
      customer_email: body.donor_email || undefined,
      success_url: `${appUrl}/donate?thanks=1`,
      cancel_url: `${appUrl}/donate`,
      metadata: {
        donor_name: String(body.donor_name).slice(0, 200),
        campaign: body.campaign ? String(body.campaign).slice(0, 200) : '',
        kind: 'donation',
      },
    })

    if (!session.url) throw new Error('No checkout URL from Stripe')
    return NextResponse.json({ checkoutUrl: session.url })
  } catch (e) {
    console.error('[api/donations/checkout]', e)
    return NextResponse.json({ error: 'Could not start card donation.' }, { status: 500 })
  }
}
