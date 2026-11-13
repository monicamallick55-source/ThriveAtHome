import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const member_id = searchParams.get('member_id')
  const { data: member } = await supabase.from('members').select('id').eq('user_id', user.id).maybeSingle()
  const targetId = member_id || member?.id
  if (!targetId) return NextResponse.json({ data: [] })
  const { data, error } = await supabase.from('check_ins').select('*').eq('member_id', targetId).order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}
