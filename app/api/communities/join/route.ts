import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { circle_id } = await req.json().catch(() => ({}))
  if (!circle_id) return NextResponse.json({ error: 'circle_id required' }, { status: 400 })
  const { error } = await supabase.from('circle_members').upsert({ circle_id, user_id: user.id, joined_at: new Date().toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ joined: true, circle_id })
}
