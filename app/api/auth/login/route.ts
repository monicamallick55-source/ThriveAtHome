import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ROLE_REDIRECTS: Record<string, string> = {
  employer: '/employer-admin', k12admin: '/school-admin',
  admin: '/admin', super_admin: '/admin', navigator: '/navigator',
  volunteer: '/volunteer/dashboard', orgadmin: '/org-admin',
  vsoadmin: '/vso-admin', uniadmin: '/university-admin',
  network: '/network-admin', seniorcenter: '/senior-center-admin',
  aaa: '/aaa-admin', agency: '/agency-admin', family: '/dashboard/family',
  member: '/dashboard', k12student: '/volunteer/dashboard',
  careworker: '/care-worker', student: '/volunteer/dashboard',
  veteran: '/volunteer/dashboard', retired_pro: '/volunteer/dashboard',
  corporate: '/volunteer/dashboard', neighbor: '/volunteer/dashboard',
  faith: '/volunteer/dashboard',
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })

    const user = data.user
    let role = user?.app_metadata?.role ?? user?.user_metadata?.role ?? ''

    // Fallback: derive role from email prefix
    if (!role && user?.email) {
      const prefix = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_')
      if (prefix in ROLE_REDIRECTS) role = prefix
    }

    const redirect = ROLE_REDIRECTS[role] ?? '/dashboard'
    return NextResponse.json({ redirect, role })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
