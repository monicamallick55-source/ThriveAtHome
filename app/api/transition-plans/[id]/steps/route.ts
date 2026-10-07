import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { id: planId } = await params
  const { step_id, status } = await req.json()
  if (!step_id || !status) return NextResponse.json({ error: 'step_id and status required' }, { status: 400 })

  const supabase = await createClient()
  const updates: Record<string, unknown> = { status }
  if (status === 'completed') updates.completed_at = new Date().toISOString()

  const { data, error } = await (supabase.from as any)('transition_plan_steps')
    .update(updates)
    .eq('id', step_id)
    .eq('plan_id', planId)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
