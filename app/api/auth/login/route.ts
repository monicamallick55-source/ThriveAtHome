import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ROLE_REDIRECTS: Record<string, string> = {
  // Short/legacy keys (email-prefix fallback)
  employer:      '/employer-admin',
  k12admin:      '/school-admin',
  admin:         '/admin',
  super_admin:   '/admin',
  navigator:     '/navigator',
  volunteer:     '/volunteer/dashboard',
  orgadmin:      '/org-admin',
  vsoadmin:      '/vso-admin',
  uniadmin:      '/university-admin',
  network:       '/network-admin',
  seniorcenter:  '/senior-center-admin',
  aaa:           '/aaa-admin',
  agency:        '/agency-admin',
  family:        '/dashboard/family',
  member:        '/dashboard',
  k12student:    '/volunteer/dashboard',
  careworker:    '/care-worker',
  student:       '/volunteer/dashboard',
  veteran:       '/volunteer/dashboard',
  retired_pro:   '/volunteer/dashboard',
  corporate:     '/volunteer/dashboard',
  neighbor:      '/volunteer/dashboard',
  faith:         '/volunteer/dashboard',
  // Underscore-style keys (set via Supabase admin app_metadata)
  org_admin:            '/org-admin',
  network_admin:        '/network-admin',
  senior_center_admin:  '/senior-center-admin',
  aaa_admin:            '/aaa-admin',
  agency_admin:         '/agency-admin',
  vso_admin:            '/vso-admin',
  university_admin:     '/university-admin',
  school_admin:         '/school-admin',
  care_worker:          '/care-worker',
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? 'Login failed' }, { status: 401 })
    }

    const user = data.user

    // Check app_metadata first (set by admin), then user_metadata
    let role = (user.app_metadata?.role ?? user.user_metadata?.role ?? '') as string

    // Email-prefix fallback: orgadmin@test.com -> "orgadmin"
    if (!role && user.email) {
      const prefix = user.email.split('@')[0].toLowerCase()
      if (prefix in ROLE_REDIRECTS) {
        role = prefix
      }
    }

    const redirect = ROLE_REDIRECTS[role] ?? '/dashboard'
    return NextResponse.json({ redirect, role })
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
