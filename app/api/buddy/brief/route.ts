import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const member_id = searchParams.get('member_id')
  const { data: member } = await supabase
    .from('members')
    .select('id, full_name, preferred_name, interests, grief_support')
    .eq(member_id ? 'id' : 'supabase_auth_id', member_id || user.id)
    .maybeSingle()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  const { data: checkins } = await supabase
    .from('check_ins').select('mood, created_at').eq('member_id', member.id)
    .order('created_at', { ascending: false }).limit(3)
  const recentMoods = checkins?.map((c: {mood: string}) => c.mood).filter(Boolean) || []
  const name = member.preferred_name || member.full_name
  const context = `Member ${name}. ` +
    (member.interests ? `Interests: ${member.interests}. ` : '') +
    (member.grief_support ? 'Receiving grief support. ' : '') +
    (recentMoods.length ? `Recent moods: ${recentMoods.join(', ')}.` : '')
  return NextResponse.json({ member_id: member.id, context, generated: true })
}
