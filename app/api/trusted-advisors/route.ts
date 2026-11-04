/**
 * app/api/trusted-advisors/route.ts — G7.16 Trusted Advisor Directory
 *
 * GET  /api/trusted-advisors  — member/family browses advisors
 * POST /api/trusted-advisors  — staff adds an advisor (or advisor self-registers via org admin)
 *
 * Specialties include: elder_law_attorney, financial_planner, geriatric_care_manager,
 *   licensed_therapist, chaplain, grief_counselor, social_worker, pharmacist,
 *   registered_dietitian, physical_therapist
 *
 * Non-proselytizing requirement: chaplains must attest non_proselytizing=true.
 * Telehealth availability is tracked per advisor.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CHAPLAIN_SPECIALTIES = ['chaplain', 'spiritual_care']

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const specialty = searchParams.get('specialty')
  const county = searchParams.get('county')
  const telehealth = searchParams.get('telehealth') // 'true' to filter telehealth-only

  let query = supabase
    .from('trusted_advisors')
    .select(`
      id, name, specialty, organization, bio,
      phone, email, website,
      license_number, license_state,
      telehealth_available, non_proselytizing,
      service_counties, languages, accepting_new_clients,
      created_at
    `)
    .eq('status', 'active')
    .order('name')

  if (specialty) query = query.eq('specialty', specialty)
  if (county) query = query.contains('service_counties', [county])
  if (telehealth === 'true') query = query.eq('telehealth_available', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ advisors: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    name, specialty, organization, bio,
    phone, email, website,
    license_number, license_state,
    telehealth_available, non_proselytizing,
    service_counties, languages, accepting_new_clients,
  } = body

  if (!name || !specialty) {
    return NextResponse.json({ error: 'name and specialty required' }, { status: 400 })
  }

  // Chaplains must attest non-proselytizing
  if (CHAPLAIN_SPECIALTIES.includes(specialty) && non_proselytizing !== true) {
    return NextResponse.json(
      { error: 'Chaplains and spiritual care advisors must confirm non-proselytizing commitment' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('trusted_advisors')
    .insert({
      name,
      specialty,
      organization: organization ?? null,
      bio: bio ?? null,
      phone: phone ?? null,
      email: email ?? null,
      website: website ?? null,
      license_number: license_number ?? null,
      license_state: license_state ?? null,
      telehealth_available: telehealth_available ?? false,
      non_proselytizing: non_proselytizing ?? false,
      service_counties: service_counties ?? [],
      languages: languages ?? ['English'],
      accepting_new_clients: accepting_new_clients ?? true,
      status: 'pending',
      added_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ advisor: data }, { status: 201 })
}
