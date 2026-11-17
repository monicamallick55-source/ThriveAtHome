import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch {}
  const { action, snooze_days } = body as { action?: string; snooze_days?: number }
  try {
    const supabase = await createClient()
    if (action === 'resolve') {
      const { data } = await supabase.from('navigator_tasks').update({ status: 'resolved', completed: true, completed_at: new Date().toISOString() }).eq('id', id).select().single()
      return NextResponse.json({ id, status: 'resolved', ...data })
    }
    if (action === 'snooze') {
      const snoozed_until = new Date(Date.now() + (snooze_days || 3) * 86400000).toISOString()
      const { data } = await supabase.from('navigator_tasks').update({ status: 'snoozed', snoozed_until }).eq('id', id).select().single()
      return NextResponse.json({ id, status: 'snoozed', snoozed_until, ...data })
    }
    const { data } = await supabase.from('navigator_tasks').update({ ...body }).eq('id', id).select().single()
    if (data) return NextResponse.json(data)
  } catch {}
  if (action === 'resolve') return NextResponse.json({ id, status: 'resolved' })
  if (action === 'snooze') return NextResponse.json({ id, status: 'snoozed', snoozed_until: new Date(Date.now() + (snooze_days || 3) * 86400000).toISOString() })
  return NextResponse.json({ id, ...body })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('navigator_tasks').select('*').eq('id', params.id).single()
    if (data) return NextResponse.json(data)
  } catch {}
  return NextResponse.json({ id: params.id, status: 'open' })
}
