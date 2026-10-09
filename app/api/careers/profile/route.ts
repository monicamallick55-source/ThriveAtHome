// app/api/careers/profile/route.ts
// GET — load own career profile
// POST — create or update career profile (upsert)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  return fm?.member_id ? fm : null
}

export async function GET() {
  const fm = await resolveUser()
  if (!fm) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from('career_profiles')
    .select('*')
    .eq('member_id', fm.member_id)
    .maybeSingle()

  return NextResponse.json({ profile: profile ?? null })
}

export async function POST(req: Request) {
  const fm = await resolveUser()
  if (!fm) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const {
    headline, summary, skills, industries, years_experience,
    work_types, hours_per_week_max, remote_ok, in_person_ok,
    desired_pay, available_from, digest_opted_in, active,
  } = body as Record<string, unknown>

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error } = await (admin as any)
    .from('career_profiles')
    .upsert({
      member_id: fm.member_id,
      headline: headline ?? null,
      summary: summary ?? null,
      skills: Array.isArray(skills) ? skills : [],
      industries: Array.isArray(industries) ? industries : [],
      years_experience: years_experience ?? null,
      work_types: Array.isArray(work_types) ? work_types : [],
      hours_per_week_max: hours_per_week_max ?? null,
      remote_ok: remote_ok ?? true,
      in_person_ok: in_person_ok ?? true,
      desired_pay: desired_pay ?? null,
      available_from: available_from ?? null,
      digest_opted_in: digest_opted_in ?? true,
      active: active ?? true,
    }, { onConflict: 'member_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile })
}
