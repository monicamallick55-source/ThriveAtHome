/**
 * app/api/encore-careers/route.ts — G6.3 Encore Careers Hub
 *
 * GET  /api/encore-careers              — list opportunities
 * POST /api/encore-careers              — create opportunity (admin/navigator)
 * GET  /api/encore-careers?my=true      — member's applications
 * POST /api/encore-careers/[id]/apply   — apply for opportunity
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const my = searchParams.get('my') === 'true'
    const type = searchParams.get('type') // part_time, consulting, board, volunteer_pro, flex
    const remote = searchParams.get('remote')

    if (my) {
      const { data: member } = await supabase.from('members').select('id').eq('supabase_auth_id', user.id).single()
      if (!member) return NextResponse.json({ applications: [] })

      const { data, error } = await supabase
        .from('encore_career_applications')
        .select('id, status, applied_at, opportunity:encore_career_opportunities(id, title, employer, type, location, remote_ok)')
        .eq('member_id', member.id)
        .order('applied_at', { ascending: false })

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ applications: data ?? [] })
    }

    let query = supabase
      .from('encore_career_opportunities')
      .select('id, title, employer, type, description, skills_needed, location, remote_ok, hours_per_week, salary_range, application_deadline, status, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (type) query = query.eq('type', type)
    if (remote === 'true') query = query.eq('remote_ok', true)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ opportunities: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, employer, type, description, skills_needed, location, remote_ok, hours_per_week, salary_range, application_deadline } = body

    if (!title || !type) return NextResponse.json({ error: 'title and type are required' }, { status: 400 })

    const VALID_TYPES = ['part_time', 'consulting', 'board', 'volunteer_pro', 'flex', 'full_time']
    if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

    const { data, error } = await supabase
      .from('encore_career_opportunities')
      .insert({
        title, employer: employer ?? null, type, description: description ?? null,
        skills_needed: skills_needed ?? null, location: location ?? null,
        remote_ok: remote_ok ?? false, hours_per_week: hours_per_week ?? null,
        salary_range: salary_range ?? null, application_deadline: application_deadline ?? null,
        status: 'open', created_by: user.id,
      })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ opportunity: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
