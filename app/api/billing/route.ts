import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: member } = await supabase.from('members').select('id, plan_tier, stripe_customer_id, stripe_subscription_id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  return NextResponse.json({ plan_tier: member.plan_tier || 'basic', stripe_customer_id: member.stripe_customer_id || null, stripe_subscription_id: member.stripe_subscription_id || null, status: member.stripe_subscription_id ? 'active' : 'none' })
}
