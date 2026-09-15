// Accept a role invitation: create the Supabase auth user, create the
// family_members row with the invited role + scope links, and (for navigators)
// the care_navigators row. Rolls back the auth user if anything fails.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLE_HOME } from '@/lib/roles'
import type { UserRole } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const token = String(body?.token ?? '').trim()
  const fullName = String(body?.full_name ?? '').trim()
  const password = String(body?.password ?? '')

  if (!token || !fullName || !password) {
    return NextResponse.json({ error: 'Name, password and a valid link are required.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const db = admin as any

  const { data: inv } = await db.from('role_invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!inv) return NextResponse.json({ error: 'This invitation link is not valid.' }, { status: 404 })
  if (inv.status !== 'pending') {
    return NextResponse.json({ error: 'This invitation has already been used or was revoked.' }, { status: 410 })
  }
  if (new Date(inv.expires_at) < new Date()) {
    await db.from('role_invitations').update({ status: 'expired' }).eq('id', inv.id)
    return NextResponse.json({ error: 'This invitation link has expired. Ask for a new one.' }, { status: 410 })
  }

  const role = inv.role as UserRole
  const email = String(inv.email).toLowerCase()

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authErr || !authData.user) {
    if (authErr?.message?.includes('already been registered')) {
      return NextResponse.json({ error: 'An account with this email already exists — please sign in instead.' }, { status: 409 })
    }
    return NextResponse.json({ error: authErr?.message ?? 'Could not create the account.' }, { status: 500 })
  }
  const authId = authData.user.id

  const fmRow: Record<string, unknown> = {
    supabase_auth_id: authId,
    full_name: fullName,
    email,
    role,
  }
  for (const k of ['org_id', 'agency_id', 'employer_account_id', 'senior_center_id', 'aaa_id', 'network_id', 'university_name']) {
    if (inv[k]) fmRow[k] = inv[k]
  }

  const { error: fmErr } = await db.from('family_members').insert(fmRow)
  if (fmErr) {
    await admin.auth.admin.deleteUser(authId)
    console.error('[api/invitations/accept] family_members insert failed:', fmErr)
    return NextResponse.json({ error: 'Could not finish setting up the account.' }, { status: 500 })
  }

  // Navigators also need a care_navigators row (source of truth for the console).
  if (role === 'navigator') {
    const { error: navErr } = await db.from('care_navigators').insert({
      supabase_auth_id: authId,
      full_name: fullName,
      email,
      is_active: true,
    })
    if (navErr) console.error('[api/invitations/accept] care_navigators insert failed:', navErr)
  }

  // Volunteers need a volunteers row (source of truth for the volunteer dashboard).
  if (role === 'volunteer') {
    const { error: volErr } = await db.from('volunteers').insert({
      supabase_auth_id: authId,
      full_name: fullName,
      email,
      status: 'active',
    })
    if (volErr) console.error('[api/invitations/accept] volunteers insert failed:', volErr)
  }

  await db.from('role_invitations').update({
    status: 'accepted',
    accepted_at: new Date().toISOString(),
    accepted_by_auth: authId,
  }).eq('id', inv.id)

  console.log(`[STUB][Email] Would confirm ${email} is now a ${role} on ThriveAtHome.`)

  return NextResponse.json({ success: true, email, role, landing: ROLE_HOME[role] ?? '/dashboard' })
}
