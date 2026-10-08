// app/api/home-safety/checks/route.ts
// POST — volunteer or staff creates an inspection check for an enrollment

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm) return NextResponse.json({ error: 'No session' }, { status: 403 })

  const isStaff = fm.role === 'admin' || fm.role === 'navigator'

  const body = await req.json().catch(() => ({}))
  const { enrollment_id, mode, scheduled_at } = body as Record<string, string | undefined>

  if (!enrollment_id) return NextResponse.json({ error: 'enrollment_id required' }, { status: 400 })

  const admin = createAdminClient()

  // Verify enrollment exists and caller is the assigned volunteer or staff
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: enrollment } = await (admin as any)
    .from('safety_program_enrollments')
    .select('id, member_id, volunteer_id')
    .eq('id', enrollment_id)
    .maybeSingle()

  if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })

  const isAssignedVolunteer = fm.member_id && fm.member_id === enrollment.volunteer_id
  if (!isStaff && !isAssignedVolunteer) {
    return NextResponse.json({ error: 'Only the assigned volunteer or staff can schedule checks' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('home_safety_checks')
    .insert({
      enrollment_id,
      member_id: enrollment.member_id,
      mode: mode ?? 'in_person',
      scheduled_at: scheduled_at ?? null,
      assessor_volunteer_id: fm.member_id ?? null,
      assessor_family_member_id: isStaff ? fm.id : null,
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
