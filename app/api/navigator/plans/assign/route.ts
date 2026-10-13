// app/api/plans/assign/route.ts
// POST — assign a plan or add-on to a member (staff only)
// DELETE — cancel a plan or add-on assignment

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { member_id, plan_id, addon_id, status = 'active', notes, trial_days } = body as {
    member_id?: string; plan_id?: string; addon_id?: string
    status?: string; notes?: string; trial_days?: number
  }

  if (!member_id || (!plan_id && !addon_id)) {
    return NextResponse.json({ error: 'member_id and either plan_id or addon_id required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data: fm } = await supabase
    .from('family_members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (plan_id) {
    // Cancel any existing active plan first
    await admin
      .from('member_plans')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: 'Plan changed' })
      .eq('member_id', member_id)
      .eq('status', 'active')

    const trialEndsAt = trial_days
      ? new Date(Date.now() + trial_days * 86400000).toISOString()
      : null

    const { data, error } = await admin
      .from('member_plans')
      .insert({
        member_id,
        plan_id,
        status: trial_days ? 'trial' : status,
        trial_ends_at: trialEndsAt,
        assigned_by: fm?.id ?? null,
        notes: notes ?? null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await admin.from('realtime_notifications').insert({
      type: 'plan_assigned',
      title: '✨ Your plan has been updated',
      body: 'Your Thrive@Home plan has been assigned or changed.',
      severity: 'info',
      member_id,
    }).catch(() => null)

    return NextResponse.json({ assignment: data }, { status: 201 })
  }

  if (addon_id) {
    const { data, error } = await admin
      .from('member_addons')
      .insert({
        member_id,
        addon_id,
        status: 'active',
        assigned_by: fm?.id ?? null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await admin.from('realtime_notifications').insert({
      type: 'addon_assigned',
      title: '✨ Add-on activated',
      body: 'A new service add-on has been added to your account.',
      severity: 'info',
      member_id,
    }).catch(() => null)

    return NextResponse.json({ assignment: data }, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { member_plan_id, member_addon_id, reason } = body as {
    member_plan_id?: string; member_addon_id?: string; reason?: string
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  if (member_plan_id) {
    const { error } = await admin
      .from('member_plans')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason ?? null,
      })
      .eq('id', member_plan_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ cancelled: true })
  }

  if (member_addon_id) {
    const { error } = await admin
      .from('member_addons')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', member_addon_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ cancelled: true })
  }

  return NextResponse.json({ error: 'member_plan_id or member_addon_id required' }, { status: 400 })
}
