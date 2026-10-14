// app/api/family-events/[id]/route.ts
// G7.2 — PATCH: update or cancel an event; DELETE: cancel

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm) return NextResponse.json({ error: 'Family member only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.title === 'string') updates.title = body.title.slice(0, 120)
  if (body.eventDate && /^\d{4}-\d{2}-\d{2}$/.test(body.eventDate)) updates.event_date = body.eventDate
  if (typeof body.notes === 'string') updates.notes = body.notes.slice(0, 500)
  if (typeof body.recurring === 'boolean') updates.recurring = body.recurring
  if (body.cancel === true) updates.cancelled_at = new Date().toISOString()

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('family_events')
    .update(updates)
    .eq('id', id)
    .eq('member_id', fm.member_id)   // RLS: family can only touch their member's events

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
