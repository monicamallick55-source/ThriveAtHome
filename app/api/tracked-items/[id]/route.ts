import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await context.params
  const body = await req.json().catch(() => ({}))
  const completed = body.action === 'complete'
  const { data, error } = await supabase.from('navigator_tasks')
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, status: completed ? 'completed' : 'pending' })
}
