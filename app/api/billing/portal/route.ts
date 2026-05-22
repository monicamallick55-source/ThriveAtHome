import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { billingProvider } from '@/lib/providers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: fm } = await admin
    .from('family_members')
    .select('member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm?.member_id) {
    return NextResponse.json({ error: 'No member found' }, { status: 404 })
  }

  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('member_id', fm.member_id)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found — subscribe first' }, { status: 404 })
  }

  try {
    const portalUrl = await billingProvider.getCustomerPortalUrl(sub.stripe_customer_id)
    return NextResponse.json({ portalUrl })
  } catch (e) {
    console.error('[billing/portal]', e)
    return NextResponse.json({ error: 'Failed to open billing portal' }, { status: 500 })
  }
}
