import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: circle_id } = await context.params

  // Find member record
  const { data: member } = await supabase.from('members')
    .select('id').eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null }))

  const member_id = member?.id ?? user.id

  await supabase.from('circle_members').upsert({
    circle_id,
    member_id,
    joined_at: new Date().toISOString(),
  }).catch(() => {})

  return NextResponse.json({ member_id, circle_id, joined: true })
}
