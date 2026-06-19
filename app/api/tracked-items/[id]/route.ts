import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { updateTrackedItem, deleteTrackedItem } from '@/lib/data/tracked-items'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ id: string }> }

async function verifyOwnership(userId: string, itemId: string) {
  const { data: fm } = await getFamilyMemberByAuthId(userId)
  if (!fm?.member_id) return null
  const admin = createAdminClient()
  const { data } = await admin
    .from('tracked_items')
    .select('id, member_id, is_recurring, recurrence_cycle_days, expiration_or_appointment_date')
    .eq('id', itemId)
    .single()
  if (!data || data.member_id !== fm.member_id) return null
  return { fm, item: data }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owned = await verifyOwnership(user.id, id)
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { action, ...rest } = body as { action?: string } & Record<string, unknown>
  const item = owned.item as {
    is_recurring: boolean
    recurrence_cycle_days: number | null
    expiration_or_appointment_date: string
  }

  if (action === 'complete') {
    // "I already took care of it"
    if (item.is_recurring && item.recurrence_cycle_days) {
      const old = new Date(item.expiration_or_appointment_date)
      old.setDate(old.getDate() + item.recurrence_cycle_days)
      const { data, error } = await updateTrackedItem(id, {
        expiration_or_appointment_date: old.toISOString().slice(0, 10),
        last_reminded_at: null,
        snoozed_until: null,
        status: 'active',
      })
      if (error) return NextResponse.json({ error }, { status: 500 })
      return NextResponse.json({ item: data })
    } else {
      const { data, error } = await updateTrackedItem(id, { status: 'completed' })
      if (error) return NextResponse.json({ error }, { status: 500 })
      return NextResponse.json({ item: data })
    }
  }

  if (action === 'snooze') {
    // "Remind me again in a week"
    const snoozeDate = new Date()
    snoozeDate.setDate(snoozeDate.getDate() + (typeof rest.days === 'number' ? rest.days : 7))
    const { data, error } = await updateTrackedItem(id, {
      snoozed_until: snoozeDate.toISOString().slice(0, 10),
      last_reminded_at: new Date().toISOString(),
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ item: data })
  }

  if (action === 'cancel') {
    const { data, error } = await updateTrackedItem(id, { status: 'cancelled' })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ item: data })
  }

  if (action === 'reschedule') {
    if (!rest.new_date || typeof rest.new_date !== 'string') {
      return NextResponse.json({ error: 'new_date is required for reschedule' }, { status: 400 })
    }
    const { data, error } = await updateTrackedItem(id, {
      expiration_or_appointment_date: rest.new_date as string,
      status: 'active',
      last_reminded_at: null,
      snoozed_until: null,
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    // Navigator notification for reschedule
    if (owned.fm.member_id) {
      await createAdminClient().from('navigator_tasks').insert({
        member_id: owned.fm.member_id,
        task_type: 'appointment_rescheduled',
        description: `Member rescheduled an appointment to ${rest.new_date}.`,
        priority: 'low',
      }).then(() => null, () => null)
    }
    return NextResponse.json({ item: data })
  }

  if (action === 'request_help') {
    // "Help me renew this" — creates navigator task
    const admin = createAdminClient()
    const { data: item2 } = await admin
      .from('tracked_items')
      .select('item_name, expiration_or_appointment_date, renewal_contact_info')
      .eq('id', id)
      .single()
    const desc = item2
      ? `Member needs help renewing: ${item2.item_name}. Due: ${item2.expiration_or_appointment_date}.${item2.renewal_contact_info ? ` Contact: ${item2.renewal_contact_info}` : ''}`
      : 'Member requested renewal help.'
    if (owned.fm.member_id) {
      await admin.from('navigator_tasks').insert({
        member_id: owned.fm.member_id,
        task_type: 'renewal_assistance',
        description: desc,
        priority: 'medium',
      }).then(() => null, () => null)
    }
    return NextResponse.json({ success: true })
  }

  // Generic field update (edit form)
  const allowedFields = [
    'item_name', 'expiration_or_appointment_date', 'reminder_lead_days',
    'recurrence_cycle_days', 'is_recurring', 'renewal_contact_info', 'notes',
    'category', 'status', 'snoozed_until',
  ]
  const updates: Record<string, unknown> = {}
  for (const f of allowedFields) {
    if (f in rest) updates[f] = rest[f]
  }
  const { data, error } = await updateTrackedItem(id, updates)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owned = await verifyOwnership(user.id, id)
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await deleteTrackedItem(id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
