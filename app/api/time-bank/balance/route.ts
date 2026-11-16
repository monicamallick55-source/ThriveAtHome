import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let member = null
  const { data: m1 } = await supabase.from('members').select('id')
    .eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null }))
  member = m1
  if (!member) {
    const { data: m2 } = await supabase.from('members').select('id')
      .eq('user_id', user.id).maybeSingle().catch(() => ({ data: null }))
    member = m2
  }
  if (!member) return NextResponse.json({ balance: 0, credits: 0 })
  const { data } = await supabase.from('time_bank_accounts').select('balance, credits')
    .eq('member_id', member.id).maybeSingle().catch(() => ({ data: null }))
  return NextResponse.json({ balance: data?.balance ?? 0, credits: data?.credits ?? 0 })
}
