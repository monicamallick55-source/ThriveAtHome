// Volunteer weekly availability (Batch 3, item 3). A volunteer publishes the
// recurring windows they can help; org admins and navigators read these to spot
// coverage gaps (see /api/org-admin/volunteer-coverage).
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getVolunteerByAuthId } from '@/lib/data/volunteers'
import { createAdminClient } from '@/lib/supabase/admin'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: volunteer } = await getVolunteerByAuthId(user.id)
  if (!volunteer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from as any)('volunteer_shifts')
    .select('id, day_of_week, start_time, end_time')
    .eq('volunteer_id', volunteer.id)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })
  return NextResponse.json({ shifts: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: volunteer } = await getVolunteerByAuthId(user.id)
  if (!volunteer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const dow = Number(body?.day_of_week)
  const start = String(body?.start_time ?? '')
  const end = String(body?.end_time ?? '')
  if (!Number.isInteger(dow) || dow < 0 || dow > 6) {
    return NextResponse.json({ error: 'day_of_week must be 0-6' }, { status: 400 })
  }
  if (!TIME_RE.test(start) || !TIME_RE.test(end) || end <= start) {
    return NextResponse.json({ error: 'Enter a valid start and end time (end after start).' }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from as any)('volunteer_shifts')
    .upsert({ volunteer_id: volunteer.id, day_of_week: dow, start_time: start, end_time: end },
      { onConflict: 'volunteer_id,day_of_week,start_time,end_time' })
    .select('id, day_of_week, start_time, end_time')
    .maybeSingle()
  if (error) {
    console.error('[api/volunteer/shifts POST]', error)
    return NextResponse.json({ error: 'Could not save that availability window.' }, { status: 500 })
  }
  return NextResponse.json({ shift: data }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: volunteer } = await getVolunteerByAuthId(user.id)
  if (!volunteer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from as any)('volunteer_shifts')
    .delete().eq('id', id).eq('volunteer_id', volunteer.id)
  if (error) return NextResponse.json({ error: 'Could not remove that window.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
