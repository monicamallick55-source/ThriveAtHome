// app/api/transition-plans/[id]/route.ts
// PATCH — update plan metadata (title, status, family_can_view, etc.)

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
  const { title, status, family_can_view, target_move_date, facility_name, facility_address, notes } = body as {
    title?: string
    status?: string
    family_can_view?: boolean
    target_move_date?: string
    facility_name?: string
    facility_address?: string
    notes?: string
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const update: Record<string, unknown> = {}
  if (title !== undefined) update.title = title
  if (status !== undefined) update.status = status
  if (family_can_view !== undefined) update.family_can_view = family_can_view
  if (target_move_date !== undefined) update.target_move_date = target_move_date
  if (facility_name !== undefined) update.facility_name = facility_name
  if (facility_address !== undefined) update.facility_address = facility_address
  if (notes !== undefined) update.notes = notes

  const { data: plan, error } = await admin
    .from('transition_plans')
    .update(update)
    .eq('id', planId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plan })
}
