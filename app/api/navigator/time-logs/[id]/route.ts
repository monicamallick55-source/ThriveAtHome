// app/api/navigator/time-logs/[id]/route.ts
// PATCH — approve / edit a time log entry (staff only for approve)
// DELETE — remove a time log (staff only)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  const body = await req.json().catch(() => ({}))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any as any
  const updates: Record<string, unknown> = {}

  if (isStaff) {
    if (body.approved !== undefined) {
      updates.approved = body.approved
      if (body.approved) {
        const { data: fm } = await supabase
          .from('family_members')
          .select('id')
          .eq('supabase_auth_id', user.id)
          .maybeSingle()
        updates.approved_by = fm?.id ?? null
        updates.approved_at = new Date().toISOString()
      } else {
        updates.approved_by = null
        updates.approved_at = null
      }
    }
    if (body.billable !== undefined) updates.billable = body.billable
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.duration_minutes !== undefined) updates.duration_minutes = body.duration_minutes
    if (body.activity_type !== undefined) updates.activity_type = body.activity_type
  } else {
    // Navigator can only edit their own unapproved log
    const { data: fm } = await supabase
      .from('family_members')
      .select('id')
      .eq('supabase_auth_id', user.id)
      .maybeSingle()

    const { data: existing } = await db
      .from('navigator_time_logs')
      .select('navigator_id, approved')
      .eq('id', id)
      .maybeSingle()

    if (!existing || existing.navigator_id !== fm?.id || existing.approved) {
      return NextResponse.json({ error: 'Forbidden or already approved' }, { status: 403 })
    }

    if (body.notes !== undefined) updates.notes = body.notes
    if (body.duration_minutes !== undefined) updates.duration_minutes = body.duration_minutes
    if (body.activity_type !== undefined) updates.activity_type = body.activity_type
  }

  const { data, error } = await db
    .from('navigator_time_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any as any
  const { error } = await db.from('navigator_time_logs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
