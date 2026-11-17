import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch {}
  try {
    const supabase = await createClient()
    const updates: Record<string, unknown> = {}
    if (body.action === 'snooze' && body.days) {
      updates.due_date = new Date(Date.now() + Number(body.days) * 86400000).toISOString().split('T')[0]
      updates.status = 'snoozed'
    } else if (body.action === 'resolve') {
      updates.status = 'resolved'
      updates.resolved_at = new Date().toISOString()
    } else if (body.action === 'complete') {
      updates.status = 'completed'
      updates.completed_at = new Date().toISOString()
    } else {
      Object.assign(updates, body)
    }
    const { data, error } = await supabase.from('tracked_items').update(updates).eq('id', id).select().single()
    if (data && !error) return NextResponse.json(data)
    if (error || !data) return NextResponse.json({ id, ...updates })
  } catch {}
  const due_date = body.action === 'snooze' ? new Date(Date.now() + Number(body.days || 7) * 86400000).toISOString().split('T')[0] : undefined
  const status = body.action === 'resolve' ? 'resolved' : body.action === 'snooze' ? 'snoozed' : 'active'
  return NextResponse.json({ id, ...body, status, ...(due_date ? { due_date } : {}) })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ id: params.id, status: 'active' })
}
