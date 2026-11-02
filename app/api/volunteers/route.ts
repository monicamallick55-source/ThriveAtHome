// app/api/volunteers/route.ts
// GET  — list/search volunteers (staff) or get own profile (volunteer)
// POST — apply as a volunteer

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { scoreVolunteerForMember as rankVolunteers } from '@/lib/volunteers/match'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const { data: isStaff } = await supabase.rpc('is_staff')
  const { searchParams } = new URL(req.url)

  if (isStaff) {
    const status = searchParams.get('status') ?? 'active'
    const metroId = searchParams.get('metro_area_id')
    const memberId = searchParams.get('match_for_member')

    if (memberId) {
      const { data: member } = await db
        .from('members')
        .select('metro_area_id, state, preferred_languages')
        .eq('id', memberId)
        .maybeSingle()

      const { data: vols } = await db
        .from('volunteers')
        .select('id, metro_area_id, state, skills, languages, availability_days, background_check_verified, training_completed, active_assignment_count')
        .eq('status', 'active')

      const ranked = rankVolunteers(
        (vols ?? []).map((v: { id: string; metro_area_id: string | null; state: string | null; skills: string[]; languages: string[]; availability_days: string[]; background_check_verified: boolean; training_completed: boolean; active_assignment_count: number }) => ({
          volunteer_id: v.id,
          metro_area_id: v.metro_area_id,
          state: v.state,
          skills: v.skills,
          languages: v.languages,
          availability_days: v.availability_days,
          background_check_verified: v.background_check_verified,
          training_completed: v.training_completed,
          active_assignment_count: v.active_assignment_count,
        })),
        {
          metro_area_id: member?.metro_area_id ?? null,
          state: member?.state ?? null,
          needed_skills: [],
          preferred_languages: member?.preferred_languages ?? [],
          preferred_days: [],
        }
      )

      return NextResponse.json({ ranked, member_id: memberId })
    }

    let query = db
      .from('volunteers')
      .select('id, full_name, email, metro_area_id, state, skills, status, background_check_verified, training_completed, active_assignment_count, total_hours')
      .eq('status', status)
      .order('total_hours', { ascending: false })
      .limit(50)

    if (metroId) query = query.eq('metro_area_id', metroId)

    const { data: volunteers, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ volunteers: volunteers ?? [] })
  }

  const { data: volunteer } = await db
    .from('volunteers')
    .select('id, full_name, status, skills, languages, availability_days, background_check_verified, training_completed, active_assignment_count, total_hours')
    .eq('email', user.email)
    .maybeSingle()

  return NextResponse.json({ volunteer: volunteer ?? null })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    full_name?: string
    phone?: string
    zip_code?: string
    skills?: string[]
    languages?: string[]
    availability_days?: string[]
  }

  if (!body.full_name) return NextResponse.json({ error: 'full_name required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  let metroAreaId: string | null = null
  let state: string | null = null
  if (body.zip_code) {
    const { data: metro } = await db
      .from('metro_areas')
      .select('id, state')
      .contains('zip_codes', [body.zip_code])
      .maybeSingle()
    metroAreaId = metro?.id ?? null
    state = metro?.state ?? null
  }

  const { data: fm } = await db.from('family_members').select('id').eq('supabase_auth_id', user.id).maybeSingle()

  const { data: volunteer, error } = await db
    .from('volunteers')
    .insert({
      family_member_id: fm?.id ?? null,
      full_name: body.full_name,
      email: user.email,
      phone: body.phone ?? null,
      zip_code: body.zip_code ?? null,
      metro_area_id: metroAreaId,
      state,
      skills: body.skills ?? [],
      languages: body.languages ?? ['English'],
      availability_days: body.availability_days ?? [],
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await db.from('navigator_tasks').insert({
    type: 'volunteer_application',
    priority: 'medium',
    title: `New volunteer application: ${body.full_name}`,
    body: `${body.full_name} (${user.email}) applied to volunteer. Skills: ${(body.skills ?? []).join(', ') || 'none listed'}. Review and initiate background check.`,
    metadata: { volunteer_id: volunteer.id },
    status: 'open',
  })

  return NextResponse.json({ volunteer, message: "Application received — we'll be in touch within 2 business days." }, { status: 201 })
}
