/**
 * app/api/vso-programs/route.ts — G7.8 Veteran Service Organization Portal
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const VALID_PROGRAM_TYPES = ['benefits_counseling','peer_support','caregiver_respite','transportation','housing','employment','health_wellness','social_connection','general']

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
      const { data: enrollments } = await supabase
        .from('vso_enrollments')
        .select('*, vso_programs(name, vso_name, program_type, branch_focus, era_focus)')
        .eq('member_id', member.id)
        .order('enrolled_at', { ascending: false })
      return NextResponse.json({ enrollments: enrollments ?? [] })
    }

    const branchFilter = url.searchParams.get('branch')
    const eraFilter = url.searchParams.get('era')
    const typeFilter = url.searchParams.get('type')

    let query = supabase
      .from('vso_programs').select('*').eq('org_id', member.org_id).eq('is_active', true).order('vso_name')

    if (branchFilter && branchFilter !== 'any') query = query.or(`branch_focus.eq.${branchFilter},branch_focus.eq.any`)
    if (eraFilter && eraFilter !== 'any') query = query.or(`era_focus.eq.${eraFilter},era_focus.eq.any`)
    if (typeFilter) query = query.eq('program_type', typeFilter)

    const { data: programs, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const programIds = (programs ?? []).map((p: any) => p.id)
    const { data: myEnroll } = await supabase
      .from('vso_enrollments').select('program_id, status').eq('member_id', member.id).in('program_id', programIds)

    const enrollMap: Record<string, string> = {}
    ;(myEnroll ?? []).forEach((e: any) => { enrollMap[e.program_id] = e.status })

    return NextResponse.json({ programs: (programs ?? []).map((p: any) => ({ ...p, my_enrollment_status: enrollMap[p.id] ?? null })) })
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
    const { vso_name, name, program_type, branch_focus, era_focus, contact_name, contact_email, contact_phone, description, eligibility_notes, website_url } = body

    if (!vso_name || !name || !program_type)
      return NextResponse.json({ error: 'vso_name, name, and program_type are required' }, { status: 400 })
    if (!VALID_PROGRAM_TYPES.includes(program_type))
      return NextResponse.json({ error: `program_type must be one of: ${VALID_PROGRAM_TYPES.join(', ')}` }, { status: 400 })

    const { data: program, error } = await supabase
      .from('vso_programs')
      .insert({
        org_id: member.org_id, vso_name, name, program_type,
        branch_focus: branch_focus ?? 'any', era_focus: era_focus ?? 'any',
        contact_name: contact_name ?? null, contact_email: contact_email ?? null,
        contact_phone: contact_phone ?? null, description: description ?? null,
        eligibility_notes: eligibility_notes ?? null, website_url: website_url ?? null,
        is_active: true, created_at: new Date().toISOString(),
      })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ program }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
