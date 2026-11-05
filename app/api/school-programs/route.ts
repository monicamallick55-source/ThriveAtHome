/**
 * app/api/school-programs/route.ts — G7.9 K-12 Curriculum Programs
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const VALID_PROGRAM_TYPES = ['pen_pals','virtual_reading','stem_mentorship','art_music','life_skills','history_storytelling','career_day','tutoring','book_club','general']
const VALID_GRADE_BANDS = ['K-2','3-5','6-8','9-12','K-5','K-8','K-12','6-12']

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('members').select('id, org_id, role').eq('supabase_auth_id', user.id).single()
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const url = new URL(req.url)

    if (url.searchParams.get('my') === 'true') {
      const { data: participations } = await supabase
        .from('school_program_participants')
        .select('*, school_programs(name, school_name, program_type, grade_band, is_remote)')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })
      return NextResponse.json({ participations: participations ?? [] })
    }

    let query = supabase
      .from('school_programs').select('*').eq('org_id', member.org_id).eq('is_active', true).order('school_name')

    const gradeFilter = url.searchParams.get('grade_band')
    const typeFilter = url.searchParams.get('type')
    const remoteOnly = url.searchParams.get('remote') === 'true'

    if (gradeFilter) query = query.eq('grade_band', gradeFilter)
    if (typeFilter) query = query.eq('program_type', typeFilter)
    if (remoteOnly) query = query.eq('is_remote', true)

    const { data: programs, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const programIds = (programs ?? []).map((p: any) => p.id)
    const { data: myParts } = await supabase
      .from('school_program_participants').select('program_id, status').eq('member_id', member.id).in('program_id', programIds)

    const partMap: Record<string, string> = {}
    ;(myParts ?? []).forEach((p: any) => { partMap[p.program_id] = p.status })

    return NextResponse.json({ programs: (programs ?? []).map((p: any) => ({ ...p, my_status: partMap[p.id] ?? null })) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('members').select('id, org_id, role').eq('supabase_auth_id', user.id).single()
    if (!member || !['admin','navigator'].includes(member.role))
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await req.json()
    const { school_name, name, program_type, grade_band, is_remote, frequency, session_duration_minutes, max_participants, contact_name, contact_email, description, curriculum_notes, district, city, state } = body

    if (!school_name || !name || !program_type || !grade_band)
      return NextResponse.json({ error: 'school_name, name, program_type, and grade_band are required' }, { status: 400 })
    if (!VALID_PROGRAM_TYPES.includes(program_type))
      return NextResponse.json({ error: `program_type must be one of: ${VALID_PROGRAM_TYPES.join(', ')}` }, { status: 400 })
    if (!VALID_GRADE_BANDS.includes(grade_band))
      return NextResponse.json({ error: `grade_band must be one of: ${VALID_GRADE_BANDS.join(', ')}` }, { status: 400 })

    const { data: program, error } = await supabase
      .from('school_programs')
      .insert({
        org_id: member.org_id, school_name, name, program_type, grade_band,
        is_remote: is_remote ?? false,
        frequency: frequency ?? null, session_duration_minutes: session_duration_minutes ?? null,
        max_participants: max_participants ?? null, contact_name: contact_name ?? null,
        contact_email: contact_email ?? null, description: description ?? null,
        curriculum_notes: curriculum_notes ?? null, district: district ?? null,
        city: city ?? null, state: state ?? null,
        is_active: true, created_at: new Date().toISOString(),
      })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ program }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
