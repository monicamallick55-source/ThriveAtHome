import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await context.params
  const body = await req.json().catch(() => ({}))
  const { action, snooze_days } = body

  if (action === 'resolve') {
    const { data, error } = await supabase.from('navigator_tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ...data, status: 'resolved' })
  }

  if (action === 'snooze') {
    const days = snooze_days || 3
    const snoozed_until = new Date(Date.now() + days * 86400000).toISOString()
    const { data, error } = await supabase.from('navigator_tasks')
      .update({ due_by: snoozed_until })
      .eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ...data, snoozed_until })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
