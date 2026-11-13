import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  let supabase: any
  try { supabase = await createClient() } catch { return NextResponse.json({ summary: 'Member context unavailable', brief: 'No data', text: 'No data', id: 'unknown' }) }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const member_id = searchParams.get('member_id')
  let member: Record<string, unknown> | null = null
  if (member_id) { const { data } = await supabase.from('members').select('id,full_name,preferred_name,interests,grief_support').eq('id', member_id).maybeSingle().catch(() => ({ data: null })); member = data }
  if (!member) { const { data } = await supabase.from('members').select('id,full_name,preferred_name,interests,grief_support').eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null })); member = data }
  if (!member) { const { data } = await supabase.from('members').select('id,full_name,preferred_name,interests,grief_support').eq('user_id', user.id).maybeSingle().catch(() => ({ data: null })); member = data }
  const { data: checkins } = await supabase.from('check_ins').select('mood,created_at').eq('member_id', member?.id || '').order('created_at', { ascending: false }).limit(3).catch(() => ({ data: null }))
  const recentMoods = ((checkins as Array<{mood: string|null}>|null)||[]).map(c=>c.mood).filter(Boolean)
  const name = (member?.preferred_name as string)||(member?.full_name as string)||'this member'
  const summary = `Member ${name}. `+(member?.interests?`Interests: ${member.interests}. `:'')+( member?.grief_support?'Receiving grief support. ':'')+( recentMoods.length?`Recent moods: ${recentMoods.join(', ')}.`:'No recent check-ins.')
  return NextResponse.json({ member_id: member?.id||null, summary, brief: summary, text: summary, generated: true })
}
