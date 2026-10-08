// app/api/home-safety/my-enrollment/route.ts
// GET — member fetches their own enrollment + proposal for the current program

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm?.member_id) return NextResponse.json({ error: 'No member record' }, { status: 403 })

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: enrollment } = await (admin as any)
    .from('safety_program_enrollments')
    .select(`
      id, status, home_type, comments, income_qualified, consent_terms_at, created_at,
      volunteer_id,
      program:safety_programs(id, name, program_year, description, enrollment_open,
        capacity_households, starts_on, ends_on, sponsors,
        contractor_partner:community_partners!safety_programs_contractor_partner_id_fkey(id, name, phone, website),
        income_referral_partner:community_partners!safety_programs_income_referral_partner_id_fkey(id, name, phone, website)
      )
    `)
    .eq('member_id', fm.member_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!enrollment) return NextResponse.json({ enrollment: null })

  // Fetch proposal if any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: proposal } = await (admin as any)
    .from('safety_proposals')
    .select(`
      id, tier_key, status, sent_at, responded_at,
      total_free_cents, total_subsidy_cents, total_member_cents,
      lines:safety_proposal_lines(
        id, item_key, description, route, est_cost_cents,
        contractor_discount_cents, subsidy_cents, member_cost_cents,
        accepted, work_order_status, completed_at, verified_by_volunteer_at
      )
    `)
    .eq('enrollment_id', enrollment.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch checks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: checks } = await (admin as any)
    .from('home_safety_checks')
    .select('id, mode, scheduled_at, completed_at, status')
    .eq('enrollment_id', enrollment.id)
    .order('created_at', { ascending: false })

  // Fetch go_bag + magnet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: goBag } = await (admin as any)
    .from('go_bags')
    .select('id, delivered_at, contents_checklist, next_refresh_due')
    .eq('enrollment_id', enrollment.id)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: magnet } = await (admin as any)
    .from('emergency_magnets')
    .select('id, generated_pdf_path, printed, delivered_at')
    .eq('enrollment_id', enrollment.id)
    .maybeSingle()

  return NextResponse.json({ enrollment, proposal, checks: checks ?? [], goBag, magnet })
}
