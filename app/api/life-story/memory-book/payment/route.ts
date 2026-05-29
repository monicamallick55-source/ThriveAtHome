import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getMemberById } from '@/lib/data/members'

// POST — create a Stripe one-time payment session for Memory Book ($9.99)
// Returns {checkoutUrl} for redirect, or {alreadyFree: true} for premium plans
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 404 })

  const { data: member } = await getMemberById(fm.member_id)
  const planTier = member?.plan_tier ?? 'basics'
  const isFree = planTier === 'complete' || planTier === 'premier'

  if (isFree) {
    return NextResponse.json({ alreadyFree: true })
  }

  let body: { successUrl?: string; cancelUrl?: string }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const successUrl = body.successUrl ?? `${appUrl}/dashboard/life-story?book_paid=true`
  const cancelUrl = body.cancelUrl ?? `${appUrl}/dashboard/life-story`

  if (!stripeKey) {
    // Stub: allow download without payment in dev/preview
    console.log('[STUB][Billing] Would charge $9.99 for Memory Book — STRIPE_SECRET_KEY not set')
    return NextResponse.json({ alreadyFree: true, stub: true })
  }

  try {
    const Stripe = (await import('stripe')).default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripe = new (Stripe as any)(stripeKey)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 999, // $9.99
            product_data: {
              name: 'Memory Book',
              description: `A beautifully designed PDF keepsake for ${member?.preferred_name ?? 'your loved one'}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        member_id: fm.member_id,
        family_member_id: user.id,
        product: 'memory_book',
      },
    })

    return NextResponse.json({ checkoutUrl: session.url })
  } catch (err) {
    console.error('[memory-book/payment] Stripe error:', err)
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 })
  }
}
