import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id: circle_id } = await context.params
  const { data: member } = await supabase.from('members').select('id')
    .eq('supabase_auth_id', user.id).maybeSingle()
  const member_id = member?.id ?? user.id
  const { error } = await supabase.from('circle_members')
    .upsert({ circle_id, user_id: user.id, member_id, joined_at: new Date().toISOString() })
  if (error) {
    await supabase.from('circle_members')
      .upsert({ circle_id, user_id: user.id, joined_at: new Date().toISOString() })
  }
  return NextResponse.json({ joined: true, circle_id, id: circle_id, member_id })
}
