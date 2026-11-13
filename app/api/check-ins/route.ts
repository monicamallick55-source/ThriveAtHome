import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  let supabase: any
  try { supabase = await createClient() } catch { return NextResponse.json([]) }
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  if (!user) return NextResponse.json([])
  const { searchParams } = new URL(req.url)
  const member_id = searchParams.get('member_id')
  let member = null
  const { data: m1 } = await supabase.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null }))
  member = m1
  if (!member) {
    const { data: m2 } = await supabase.from('members').select('id').eq('user_id', user.id).maybeSingle().catch(() => ({ data: null }))
    member = m2
  }
  const targetId = member_id || member?.id
  if (!targetId) return NextResponse.json([])
  const { data } = await supabase
    .from('check_ins').select('*').eq('member_id', targetId)
    .order('created_at', { ascending: false }).limit(50).catch(() => ({ data: null }))
  return NextResponse.json(data || [])
}
