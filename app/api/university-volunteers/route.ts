/**
 * app/api/university-volunteers/route.ts — G7.7 Student Volunteer Portal
 *
 * GET  /api/university-volunteers         — list university programs
 * POST /api/university-volunteers         — create/register a university program (admin)
 * GET  /api/university-volunteers?my=true — student's own volunteer hours/applications
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('members')
      .select('id, org_id, role')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const url = new URL(req.url)
    const myHours = url.searchParams.get('my') === 'true'

    if (myHours) {
      const { data: hours } = await supabase
        .from('volunteer_hours')
        .select('*, university_programs(name, university_name)')
        .eq('member_id', member.id)
        .order('service_date', { ascending: false })

      const { data: applications } = await supabase
        .from('volunteer_applications')
        .select('*, university_programs(name, university_name, program_type)')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })

      return NextResponse.json({ hours: hours ?? [], applications: applications ?? [] })
    }

    const { data: programs, error } = await supabase
      .from('university_programs')
      .select('*')
      .eq('org_id', member.org_id)
      .eq('is_active', true)
      .order('university_name')

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // For each program, get application count
    const programIds = (programs ?? []).map((p: any) => p.id)
    const { data: appCounts } = await supabase
      .from('volunteer_applications')
      .select('program_id')
      .in('program_id', programIds)
      .eq('status', 'approved')

    const countMap: Record<string, number> = {}
    ;(appCounts ?? []).forEach((a: any) => {
      countMap[a.program_id] = (countMap[a.program_id] ?? 0) + 1
    })

    const enriched = (programs ?? []).map((p: any) => ({
      ...p,
      active_volunteers: countMap[p.id] ?? 0,
    }))

    return NextResponse.json({ programs: enriched })
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
      .from('members')
      .select('id, org_id, role')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!member || !['admin', 'navigator'].includes(member.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const {
      university_name, name, program_type, contact_name, contact_email,
      required_hours, term_start, term_end, max_students, description, notes,
    } = body

    if (!university_name || !name || !program_type) {
      return NextResponse.json({ error: 'university_name, name, and program_type are required' }, { status: 400 })
    }

    const VALID_TYPES = ['service_learning', 'internship', 'capstone', 'community_service', 'research', 'work_study']
    if (!VALID_TYPES.includes(program_type)) {
      return NextResponse.json({ error: `program_type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
    }

    const { data: program, error } = await supabase
      .from('university_programs')
      .insert({
        org_id: member.org_id,
        university_name,
        name,
        program_type,
        contact_name: contact_name ?? null,
        contact_email: contact_email ?? null,
        required_hours: required_hours ?? null,
        term_start: term_start ?? null,
        term_end: term_end ?? null,
        max_students: max_students ?? null,
        description: description ?? null,
        notes: notes ?? null,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ program }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
