// Agency companion visit log — creates a care_visits row with visit_type=companionship.
// Agency admin only.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getAgencyAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('role, agency_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || fm.role !== 'agency_admin' || !fm.agency_id) return null
  return { admin, agencyId: fm.agency_id as string }
}

export async function POST(req: NextRequest) {
  const ctx = await getAgencyAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { admin, agencyId } = ctx

  let body: { member_id?: string; visit_date?: string; duration_minutes?: number; visit_type?: string; notes?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  if (!body.member_id || !body.visit_date) {
    return NextResponse.json({ error: 'member_id and visit_date are required' }, { status: 400 })
  }

  // Use the first active worker in this agency as placeholder (companion visit logged by admin)
  const { data: worker } = await (admin as any)
    .from('care_workers')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (!worker) {
    return NextResponse.json({ error: 'No active care workers found in this agency. Add a worker first.' }, { status: 400 })
  }

  const durationMin = body.duration_minutes ?? 30

  const { data: visit, error: vErr } = await (admin as any)
    .from('care_visits')
    .insert({
      agency_id: agencyId,
      care_worker_id: worker.id,
      member_id: body.member_id,
      scheduled_date: body.visit_date,
      scheduled_start_time: '09:00:00',
      scheduled_end_time: '10:00:00',
      actual_check_in_at: new Date(`${body.visit_date}T09:00:00`).toISOString(),
      actual_check_out_at: new Date(`${body.visit_date}T09:00:00`).toISOString(),
      duration_minutes: durationMin,
      visit_type: (body.visit_type ?? 'companionship') as 'companionship',
      status: 'completed' as const,
      care_worker_notes: body.notes?.trim() || null,
      billable_hours: durationMin / 60,
    })
    .select('id, scheduled_date, visit_type, duration_minutes, care_worker_notes, status')
    .maybeSingle()

  if (vErr || !visit) {
    return NextResponse.json({ error: vErr?.message ?? 'Failed to log visit' }, { status: 500 })
  }

  return NextResponse.json({ visit }, { status: 201 })
}
