import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getCurrentUser } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { getMemberSubscription } from '@/lib/data/billing'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' as any })

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: member } = await getMemberForAuthUser(user.id)
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { data: sub } = await getMemberSubscription(member.id)
  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: 'No active subscription found. Please choose a plan first.' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thriveathome.app'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${appUrl}/dashboard/billing`,
    })
    return NextResponse.json({ portalUrl: session.url })
  } catch (e) {
    console.error('[billing/portal]', e)
    return NextResponse.json({ error: 'Could not open billing portal. Please contact support.' }, { status: 500 })
  }
}
