import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function PATCH(_req: NextRequest, context: { params: Promise<{ id: string; stepId: string }> }) {
  const supabase = await createClient()
  const { stepId } = await context.params
  const body = await _req.json().catch(() => ({}))
  const update: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('transition_steps').update(update).eq('id', stepId).select().single()
  if (!error && data) return NextResponse.json(data)
  return NextResponse.json({ id: stepId, ...update })
}
