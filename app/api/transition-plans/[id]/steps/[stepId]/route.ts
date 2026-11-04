/**
 * app/api/transition-plans/[id]/steps/[stepId]/route.ts — G7.15
 *
 * PATCH /api/transition-plans/[id]/steps/[stepId]
 *   — Navigator or member marks a step complete, adds notes, etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; stepId: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { status, navigator_notes, resources } = body

  const updates: Record<string, unknown> = {}
  if (status) {
    updates.status = status
    if (status === 'completed') updates.completed_at = new Date().toISOString()
  }
  if (navigator_notes !== undefined) updates.navigator_notes = navigator_notes
  if (resources !== undefined) updates.resources = resources

  const { data, error } = await supabase
    .from('transition_plan_steps')
    .update(updates)
    .eq('id', params.stepId)
    .eq('transition_plan_id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Check if all steps for this plan are completed; if so, close the plan
  const { data: allSteps } = await supabase
    .from('transition_plan_steps')
    .select('status')
    .eq('transition_plan_id', params.id)

  const allDone = (allSteps ?? []).every((s: { status: string }) => s.status === 'completed' || s.status === 'skipped')
  if (allDone) {
    await supabase
      .from('transition_plans')
      .update({ status: 'completed' })
      .eq('id', params.id)
  }

  return NextResponse.json({ step: data, plan_completed: allDone })
}
