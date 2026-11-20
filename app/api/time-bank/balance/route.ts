import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  // Look up member row
  let memberId: string | null = null
  const { data: m1 } = await supabase.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null }))
  if (m1) memberId = m1.id
  if (!memberId) {
    const { data: m2 } = await supabase.from('members').select('id').eq('auth_id', user.id).maybeSingle().catch(() => ({ data: null }))
    if (m2) memberId = m2.id
  }
  // Look up family_member row (time_bank_credits uses earner_family_member_id)
  let familyMemberId: string | null = null
  const { data: fm } = await supabase.from('family_members').select('id').eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null }))
  if (fm) familyMemberId = fm.id
  // Sum credits
  let balance = 0
  let credits = 0
  if (familyMemberId) {
    const { data: rows } = await supabase.from('time_bank_credits').select('credits').eq('earner_family_member_id', familyMemberId).catch(() => ({ data: null }))
    if (rows) {
      balance = rows.reduce((s: number, r: { credits: number }) => s + (r.credits || 0), 0)
      credits = balance
    }
  } else if (memberId) {
    const { data: rows } = await supabase.from('time_bank_credits').select('credits').eq('performed_for_member_id', memberId).catch(() => ({ data: null }))
    if (rows) {
      balance = rows.reduce((s: number, r: { credits: number }) => s + (r.credits || 0), 0)
      credits = balance
    }
  }
  return NextResponse.json({ balance, credits })
}
