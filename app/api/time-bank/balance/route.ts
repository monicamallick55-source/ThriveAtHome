import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: member } = await supabase.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ balance: 0 })
  const { data } = await supabase.from('time_bank_accounts').select('balance').eq('member_id', member.id).maybeSingle().catch(() => ({ data: null }))
  return NextResponse.json({ balance: data?.balance ?? 0 })
}
