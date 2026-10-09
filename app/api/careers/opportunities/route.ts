// app/api/careers/opportunities/route.ts
// GET — list active opportunities (members) or all (staff)
// POST — create opportunity (staff only)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  return fm
}

export async function GET() {
  const fm = await resolveUser()
  if (!fm) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const admin = createAdminClient()
  const isStaff = fm.role === 'admin' || fm.role === 'navigator'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from('career_opportunities')
    .select('id, title, organization, description, work_type, location, remote_ok, hours_per_week, pay, skills_desired, industries, apply_url, apply_email, closes_on, status, created_at')
    .order('created_at', { ascending: false })

  if (!isStaff) {
    query = query.eq('status', 'active')
  }

  const { data: opportunities } = await query
  return NextResponse.json({ opportunities: opportunities ?? [] })
}

export async function POST(req: Request) {
  const fm = await resolveUser()
  if (!fm || !['admin', 'navigator'].includes(fm.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const {
    title, organization, description, work_type, location,
    remote_ok, hours_per_week, pay, skills_desired, industries,
    apply_url, apply_email, closes_on,
  } = body as Record<string, unknown>

  if (!title || !organization || !description || !work_type) {
    return NextResponse.json({ error: 'title, organization, description, work_type required' }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opp, error } = await (admin as any)
    .from('career_opportunities')
    .insert({
      posted_by: fm.member_id,
      title, organization, description, work_type,
      location: location ?? null,
      remote_ok: remote_ok ?? false,
      hours_per_week: hours_per_week ?? null,
      pay: pay ?? null,
      skills_desired: Array.isArray(skills_desired) ? skills_desired : [],
      industries: Array.isArray(industries) ? industries : [],
      apply_url: apply_url ?? null,
      apply_email: apply_email ?? null,
      closes_on: closes_on ?? null,
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ opportunity: opp }, { status: 201 })
}
