// app/api/transition-plans/[id]/steps/route.ts
// PATCH — mark a step complete / incomplete

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: planId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { step_id, completed } = body as { step_id?: string; completed?: boolean }
  if (!step_id) return NextResponse.json({ error: 'step_id required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Get navigator family_member id
  const { data: navFm } = await admin
    .from('family_members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const { data: step, error } = await admin
    .from('transition_plan_steps')
    .update({
      completed_at: completed ? new Date().toISOString() : null,
      completed_by: completed ? (navFm?.id ?? null) : null,
    })
    .eq('id', step_id)
    .eq('plan_id', planId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ step })
}
