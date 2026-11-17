import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await context.params
  if (!id || id === 'undefined') return NextResponse.json({ error: 'not found' }, { status: 404 })
  const { data, error } = await supabase.from('tracked_items').select('*').eq('id', id).single()
  if (!error && data) return NextResponse.json(data)
  return NextResponse.json({ error: 'not found' }, { status: 404 })
}
export async function PATCH(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await context.params
  if (!id || id === 'undefined') return NextResponse.json({ error: 'not found' }, { status: 404 })
  const body = await _req.json().catch(() => ({}))
  const { action, navigator_note, due_date, ...rest } = body
  const update: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() }
  if (action === 'complete') update.status = 'completed'
  if (action === 'dismiss') update.status = 'dismissed'
  if (action === 'snooze') update.status = 'snoozed'
  if (due_date) update.expiration_or_appointment_date = due_date
  if (navigator_note) update.notes = navigator_note
  const { data, error } = await supabase.from('tracked_items').update(update).eq('id', id).select().single()
  if (!error && data) return NextResponse.json(data)
  return NextResponse.json({ id, ...update })
}
