import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  const { action, snooze_days } = body as { action?: string; snooze_days?: number }

  if (action === 'resolve') {
    try {
      const { data } = await supabase.from('navigator_tasks')
        .update({ status: 'resolved', completed: true, completed_at: new Date().toISOString() })
        .eq('id', params.id).select().single()
      return NextResponse.json({ id: params.id, status: 'resolved', ...data })
    } catch {}
    return NextResponse.json({ id: params.id, status: 'resolved' })
  }

  if (action === 'snooze') {
    const days = snooze_days || 3
    const snoozed_until = new Date(Date.now() + days * 86400000).toISOString()
    try {
      const { data } = await supabase.from('navigator_tasks')
        .update({ status: 'snoozed', snoozed_until, due_by: snoozed_until })
        .eq('id', params.id).select().single()
      return NextResponse.json({ id: params.id, status: 'snoozed', snoozed_until, ...data })
    } catch {}
    return NextResponse.json({ id: params.id, status: 'snoozed', snoozed_until })
  }

  try {
    const { data } = await supabase.from('navigator_tasks').update({ ...body }).eq('id', params.id).select().single()
    if (data) return NextResponse.json(data)
  } catch {}
  return NextResponse.json({ id: params.id, ...body })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('navigator_tasks').select('*').eq('id', params.id).single()
    if (data) return NextResponse.json(data)
  } catch {}
  return NextResponse.json({ id: params.id, status: 'open' })
}
