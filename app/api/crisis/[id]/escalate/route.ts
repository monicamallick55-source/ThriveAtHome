import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await context.params
  const body = await _req.json().catch(() => ({}))
  const step = body.step ?? 1
  const { data, error } = await supabase.from('crisis_events')
    .update({ escalation_step: step, escalated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (!error && data) return NextResponse.json({ ...data, escalation_step: step })
  return NextResponse.json({ id, escalation_step: step, action: body.action, status: 'escalated' })
}
