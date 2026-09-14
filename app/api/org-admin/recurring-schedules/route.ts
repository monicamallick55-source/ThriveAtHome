// Org admin: create, list and pause recurring service schedules (Batch 3, item 2).
// A recurring schedule generates a service_bookings row every week / two weeks via
// the /api/cron/recurring-bookings cron.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireOrgAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, fm: null, error: 'Unauthorized' as const, status: 401 }
  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('id, role, org_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) {
    return { user, fm: null, error: 'Forbidden' as const, status: 403 }
  }
  if (!fm.org_id) return { user, fm: null, error: 'No org linked to your account' as const, status: 400 }
  return { user, fm, error: null, status: 200 }
}

/** Given a day-of-week (0=Sun..6=Sat), the next date on/after `from` that lands on it. */
function nextDowDate(from: Date, dow: number): string {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  const diff = (dow - d.getUTCDay() + 7) % 7
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

export async function GET() {
  const { fm, error, status } = await requireOrgAdmin()
  if (error || !fm) return NextResponse.json({ error }, { status })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from as any)('recurring_service_schedules')
    .select('id, member_id, service_type, cadence, day_of_week, time_of_day, notes, next_run_date, is_active, last_generated_at, members(preferred_name, full_name)')
    .eq('org_id', fm.org_id)
    .order('created_at', { ascending: false })
  return NextResponse.json({ schedules: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { fm, error, status } = await requireOrgAdmin()
  if (error || !fm) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  const memberId = body?.member_id
  const serviceType = String(body?.service_type ?? '').trim()
  const cadence = body?.cadence === 'biweekly' ? 'biweekly' : 'weekly'
  const dayOfWeek = Number(body?.day_of_week)
  const timeOfDay = typeof body?.time_of_day === 'string' ? body.time_of_day.slice(0, 5) : null

  if (!memberId || !serviceType) {
    return NextResponse.json({ error: 'member_id and service_type are required' }, { status: 400 })
  }
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return NextResponse.json({ error: 'day_of_week must be 0-6' }, { status: 400 })
  }

  const admin = createAdminClient()
  // Confirm the member belongs to this org (active membership).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mem } = await (admin.from as any)('org_memberships')
    .select('id').eq('org_id', fm.org_id).eq('member_id', memberId).maybeSingle()
  if (!mem) return NextResponse.json({ error: 'That member is not in your organization.' }, { status: 400 })

  const nextRun = nextDowDate(new Date(), dayOfWeek)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: insErr } = await (admin.from as any)('recurring_service_schedules').insert({
    org_id: fm.org_id,
    member_id: memberId,
    created_by: fm.id,
    service_type: serviceType,
    cadence,
    day_of_week: dayOfWeek,
    time_of_day: timeOfDay,
    notes: typeof body?.notes === 'string' ? body.notes.trim().slice(0, 500) : null,
    next_run_date: nextRun,
    is_active: true,
  }).select('id').single()

  if (insErr) {
    console.error('[api/org-admin/recurring-schedules POST]', insErr)
    return NextResponse.json({ error: 'Could not create the schedule.' }, { status: 500 })
  }
  return NextResponse.json({ schedule: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { fm, error, status } = await requireOrgAdmin()
  if (error || !fm) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  const id = body?.id
  if (!id || typeof body?.is_active !== 'boolean') {
    return NextResponse.json({ error: 'id and is_active (boolean) required' }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updErr } = await (admin.from as any)('recurring_service_schedules')
    .update({ is_active: body.is_active })
    .eq('id', id)
    .eq('org_id', fm.org_id)
  if (updErr) return NextResponse.json({ error: 'Could not update the schedule.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
