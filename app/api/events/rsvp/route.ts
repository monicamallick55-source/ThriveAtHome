import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { event_id, status } = await req.json().catch(() => ({}))
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  const { data, error } = await supabase.from('event_rsvps').upsert({ event_id, user_id: user.id, status: status ?? 'attending', created_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
