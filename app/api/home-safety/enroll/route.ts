// app/api/home-safety/enroll/route.ts
// POST — member enrolls in (or applies to) a home safety program

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm?.member_id) return NextResponse.json({ error: 'No member record' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { program_id, home_type, comments, income_qualified, consent_terms } = body as Record<string, string | boolean | undefined>

  if (!program_id) return NextResponse.json({ error: 'program_id required' }, { status: 400 })
  if (!consent_terms) return NextResponse.json({ error: 'You must consent to the program terms' }, { status: 400 })

  const admin = createAdminClient()

  // Load program to check eligibility and capacity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: program } = await (admin as any)
    .from('safety_programs')
    .select('id, enrollment_open, capacity_households, eligibility')
    .eq('id', program_id)
    .maybeSingle()

  if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  if (!program.enrollment_open) return NextResponse.json({ error: 'Enrollment is closed for this program' }, { status: 400 })

  // Check member's subscription tier against eligibility
  const { data: member } = await admin
    .from('members')
    .select('subscription_tier')
    .eq('id', fm.member_id)
    .maybeSingle()

  const eligibility = program.eligibility as { org_tiers?: string[] } | null
  if (eligibility?.org_tiers?.length && member) {
    const tier = (member as Record<string, string>).subscription_tier ?? 'social'
    if (!eligibility.org_tiers.includes(tier)) {
      return NextResponse.json({
        error: `This program requires a ${eligibility.org_tiers.join(' or ')} membership. Your current plan is ${tier}.`,
      }, { status: 403 })
    }
  }

  // Count current enrolled (not waitlisted/declined/withdrawn)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (admin as any)
    .from('safety_program_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('program_id', program_id)
    .in('status', ['applied', 'enrolled', 'training_scheduled', 'inspected', 'proposal_sent', 'work_in_progress'])

  const isWaitlisted = (count ?? 0) >= program.capacity_households

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('safety_program_enrollments')
    .insert({
      program_id,
      member_id: fm.member_id,
      home_type: home_type ?? 'single_family',
      comments: (comments as string | undefined)?.trim() ?? null,
      income_qualified: income_qualified ?? null,
      consent_terms_at: new Date().toISOString(),
      status: isWaitlisted ? 'waitlisted' : 'applied',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'You are already enrolled in this program' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ enrollment: data, waitlisted: isWaitlisted }, { status: 201 })
}
