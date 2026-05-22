import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { billingProvider } from '@/lib/providers'
import type { PlanTier } from '@/lib/interfaces/BillingProvider'

const VALID_TIERS: PlanTier[] = ['basics', 'connect', 'complete', 'premier']

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { planTier?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const planTier = body.planTier as PlanTier
  if (!VALID_TIERS.includes(planTier)) {
    return NextResponse.json({ error: 'Invalid plan tier' }, { status: 400 })
  }

  const { data: member, error } = await getMemberForAuthUser(user.id)
  if (error || !member) {
    return NextResponse.json({ error: 'Member not found — complete onboarding first' }, { status: 404 })
  }

  try {
    const checkoutUrl = await billingProvider.createCheckoutSession(planTier, member.id, user.id)
    return NextResponse.json({ checkoutUrl })
  } catch (e) {
    console.error('[billing/checkout]', e)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
