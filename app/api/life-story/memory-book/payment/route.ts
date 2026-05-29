import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getMemberById } from '@/lib/data/members'
import { getLatestPurchasedBook, incrementRegenCount } from '@/lib/data/life-story'

// Pricing in cents: [connect_price, basics_price, memorial_price]
const FORMAT_PRICING: Record<string, [number, number, number]> = {
  memory_book: [1499, 1999, 2499],
  collage:     [999,  1299, 2499],
  both:        [1999, 2499, 2499],
}

function getFormatLabel(formatType: string): string {
  if (formatType === 'collage') return 'Memory Collage'
  if (formatType === 'both') return 'Memory Book + Memory Collage'
  return 'Memory Book'
}

function getPriceInCents(formatType: string, planTier: string, isMemorial: boolean): number | null {
  if (planTier === 'complete' || planTier === 'premier') return null
  const tiers = FORMAT_PRICING[formatType] ?? FORMAT_PRICING.memory_book
  if (isMemorial) return tiers[2]
  return planTier === 'connect' ? tiers[0] : tiers[1]
}

// POST — returns pricing, regen info, or checkout URL
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 404 })

  const { data: member } = await getMemberById(fm.member_id)
  const planTier = member?.plan_tier ?? 'basics'
  const isMemorial = member?.status === 'inactive'
  const isFree = planTier === 'complete' || planTier === 'premier'

  let body: {
    successUrl?: string
    cancelUrl?: string
    formatType?: string
    regenBookId?: string
  }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const formatType = body.formatType ?? 'memory_book'

  // If user confirmed regen, increment count and allow
  if (body.regenBookId) {
    await incrementRegenCount({ id: body.regenBookId, memberId: fm.member_id })
    return NextResponse.json({ alreadyFree: true, regen: true })
  }

  if (isFree) return NextResponse.json({ alreadyFree: true })

  // Check for purchase within 30 days (regeneration logic)
  const { data: latestBook } = await getLatestPurchasedBook({ memberId: fm.member_id, formatType })
  if (latestBook) {
    const regenRemaining = Math.max(0, 3 - (latestBook.regeneration_count ?? 0))
    const purchaseDate = new Date(latestBook.created_at)
    const expiresAt = new Date(purchaseDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiresLabel = expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const purchaseLabel = purchaseDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    if (regenRemaining > 0) {
      return NextResponse.json({
        regenAllowed: true,
        regenBookId: latestBook.id,
        regenRemaining,
        regenTotal: 3,
        purchaseDate: purchaseLabel,
        expiresAt: expiresLabel,
      })
    }

    return NextResponse.json({
      blocked: true,
      message: `You purchased this format on ${purchaseLabel}. You have used all 3 regenerations (valid until ${expiresLabel}). Upgrade to Complete or Premier for unlimited regenerations.`,
    }, { status: 429 })
  }

  const priceInCents = getPriceInCents(formatType, planTier, isMemorial)
  if (priceInCents === null) return NextResponse.json({ alreadyFree: true })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const successUrl = body.successUrl ?? `${appUrl}/dashboard/life-story?book_paid=true&format=${formatType}`
  const cancelUrl = body.cancelUrl ?? `${appUrl}/dashboard/life-story`

  if (!stripeKey) {
    console.log(`[STUB][Billing] Would charge $${(priceInCents / 100).toFixed(2)} for ${getFormatLabel(formatType)} — STRIPE_SECRET_KEY not set`)
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
            unit_amount: priceInCents,
            product_data: {
              name: getFormatLabel(formatType),
              description: `A beautifully designed keepsake for ${member?.preferred_name ?? 'your loved one'}`,
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
        product: formatType,
        format_type: formatType,
      },
    })

    return NextResponse.json({
      checkoutUrl: session.url,
      priceInCents,
      formatType,
    })
  } catch (err) {
    console.error('[memory-book/payment] Stripe error:', err)
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 })
  }
}

// GET — return pricing info for a format + current plan (no Stripe involved)
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 404 })

  const { data: member } = await getMemberById(fm.member_id)
  const planTier = member?.plan_tier ?? 'basics'
  const isMemorial = member?.status === 'inactive'
  const isFree = planTier === 'complete' || planTier === 'premier'

  const url = new URL(req.url)
  const formatType = url.searchParams.get('format') ?? 'memory_book'

  const priceInCents = getPriceInCents(formatType, planTier, isMemorial)

  return NextResponse.json({
    isFree: isFree || priceInCents === null,
    priceInCents,
    priceDollars: priceInCents ? (priceInCents / 100).toFixed(2) : null,
    planTier,
    isMemorial,
  })
}
