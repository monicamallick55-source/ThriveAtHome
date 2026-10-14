// app/api/family-events/route.ts
// G7.2 — Family Events Calendar
// GET  list upcoming events for member
// POST create new event

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveCtx(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (fm) return { familyMemberId: fm.id as string, memberId: fm.member_id as string, role: fm.role as string }

  const { data: m } = await supabase
    .from('members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (m) return { familyMemberId: null, memberId: m.id as string, role: 'member' }

  return null
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const ctx = await resolveCtx(supabase)
  if (!ctx) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('memberId') ?? ctx.memberId

  // Family can only query their own member
  if (ctx.role !== 'admin' && ctx.role !== 'navigator' && memberId !== ctx.memberId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('family_events')
    .select('*, created_by_member:family_members!created_by(full_name)')
    .eq('member_id', memberId)
    .is('cancelled_at', null)
    .gte('event_date', new Date().toISOString().slice(0, 10))
    .order('event_date', { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ events: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const ctx = await resolveCtx(supabase)
  if (!ctx) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  if (!ctx.familyMemberId) {
    return NextResponse.json({ error: 'Only family members can create events' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { eventType, title, eventDate, recurring, notes } = body

  const VALID_TYPES = ['birthday', 'anniversary', 'holiday', 'milestone', 'graduation', 'homecoming', 'other']
  if (!VALID_TYPES.includes(eventType)) {
    return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 })
  }
  if (!title || typeof title !== 'string' || title.length < 1 || title.length > 120) {
    return NextResponse.json({ error: 'title must be 1–120 chars' }, { status: 400 })
  }
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return NextResponse.json({ error: 'eventDate must be YYYY-MM-DD' }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('family_events')
    .insert({
      member_id: ctx.memberId,
      created_by: ctx.familyMemberId,
      event_type: eventType,
      title,
      event_date: eventDate,
      recurring: recurring === true,
      notes: typeof notes === 'string' ? notes.slice(0, 500) : null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, eventId: data.id }, { status: 201 })
}
