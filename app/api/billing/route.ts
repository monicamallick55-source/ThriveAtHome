import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: member } = await supabase.from('members').select('id, plan_tier, status')
    .eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null }))
  return NextResponse.json({ plan: member?.plan_tier ?? 'basics', status: member?.status ?? 'active', member_id: member?.id ?? null, subscription_id: null, current_period_end: null, seat_count: 1, quantity: 1 })
}
