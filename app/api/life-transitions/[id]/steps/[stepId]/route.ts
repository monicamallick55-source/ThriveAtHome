import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string; stepId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, stepId } = await context.params
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({ id: stepId, transition_id: id, ...body, updated_at: new Date().toISOString() })
}
