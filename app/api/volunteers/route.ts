import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { scoreVolunteerForMember as rankVolunteers } from '@/lib/volunteers/match'

const MOCK_VOLUNTEERS = [
  { id: 'vol-mock-001', name: 'Carol Helper', status: 'active', skills: ['driving','companionship'], availability: 'weekdays' },
  { id: 'vol-mock-002', name: 'Dave Assist', status: 'active', skills: ['errands','tech_help'], availability: 'weekends' },
]


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
      const { data: member } = await db.from('members').select('*').eq('id', memberId).maybeSingle()
      const { data: vols } = await db.from('volunteers')
        .select('id, metro_area_id, state, skills, languages, availability_days, background_check_verified, training_completed, active_assignment_count')
        .eq('status', 'active')
      const ranked = rankVolunteers(
        (vols ?? []).map((v: any) => ({
          volunteer_id: v.id, metro_area_id: v.metro_area_id, state: v.state,
          skills: v.skills, languages: v.languages, availability_days: v.availability_days,
          background_check_verified: v.background_check_verified,
          training_completed: v.training_completed, active_assignment_count: v.active_assignment_count,
        })),
        member ?? ({} as any)
      )
      return NextResponse.json({ ranked, member_id: memberId })
    }

    let query = db.from('volunteers')
      .select('id, full_name, email, metro_area_id, state, skills, status, background_check_verified, training_completed, active_assignment_count, total_hours')
      .eq('status', status).order('total_hours', { ascending: false }).limit(50)
    if (metroId) query = query.eq('metro_area_id', metroId)
    const { data: volunteers, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(volunteers ?? [])
  }

  const { data: volunteer } = await db.from('volunteers')
    .select('id, full_name, status, skills, languages, availability_days, background_check_verified, training_completed, active_assignment_count, total_hours')
    .eq('email', user.email).maybeSingle()
  return NextResponse.json(volunteer ? [volunteer] : [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = await req.json().catch(() => ({})) as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  const full_name = body.full_name || user.email?.split('@')[0] || 'Volunteer'

  let metroAreaId: string | null = null
  let state: string | null = null
  if (body.zip_code) {
    const { data: metro } = await db.from('metro_areas').select('id, state').contains('zip_codes', [body.zip_code]).maybeSingle()
    metroAreaId = metro?.id ?? null
    state = metro?.state ?? null
  }

  const { data: fm } = await db.from('family_members').select('id').eq('supabase_auth_id', user.id).maybeSingle()

  // Return existing volunteer if already applied
  const { data: existing } = await db.from('volunteers').select('id, status').eq('email', user.email).maybeSingle()
  if (existing) return NextResponse.json({ id: existing.id, status: existing.status === 'active' ? 'pending_review' : existing.status }, { status: 200 })

  const { data: volunteer, error } = await db.from('volunteers').insert({
    family_member_id: fm?.id ?? null,
    full_name,
    email: user.email,
    phone: body.phone ?? null,
    zip_code: body.zip_code ?? null,
    metro_area_id: metroAreaId,
    state,
    skills: body.service_types ?? body.skills ?? [],
    languages: body.languages ?? ['English'],
    availability_days: body.availability?.days ?? body.availability_days ?? [],
    status: 'pending_review',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await db.from('navigator_tasks').insert({
    task_type: 'volunteer_application',
    priority: 'medium',
    description: `${full_name} (${user.email}) applied to volunteer.`,
    completed: false,
  }).catch(() => {})

  return NextResponse.json({ id: volunteer.id, status: volunteer.status, ...volunteer }, { status: 201 })
}
