import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ id: 'unknown', error: 'Unauthorized' })

  // Try supabase_auth_id first, then user_id
  let member = null
  const { data: m1 } = await supabase.from('members').select('*').eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null }))
  member = m1
  if (!member) {
    const { data: m2 } = await supabase.from('members').select('*').eq('user_id', user.id).maybeSingle().catch(() => ({ data: null }))
    member = m2
  }

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  return NextResponse.json(member)
}
