import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await (admin as any).from('celebrations')
    .select('*')
    .eq('member_id', user.id)
    .order('event_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const celebrationType = body.celebration_type || body.event_type || 'birthday'
  const eventDate = body.event_date || body.occasion_date
  if (!eventDate) return NextResponse.json({ error: 'event_date required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await (admin as any).from('celebrations').insert({
    member_id: user.id,
    celebration_type: celebrationType,
    event_date: eventDate,
    title: body.title || `${celebrationType} celebration`,
    status: 'pending',
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data?.id }, { status: 201 })
}
