import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, full_name, password } = body as { token?: string; full_name?: string; password?: string }

  if (!token || !full_name || !password) {
    return NextResponse.json({ error: 'token, full_name, and password are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: inv } = await admin
    .from('employer_invitations')
    .select('id, email, employer_account_id, status, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (!inv) {
    return NextResponse.json({ error: 'Invalid invitation link' }, { status: 404 })
  }
  if (inv.status !== 'pending') {
    return NextResponse.json({ error: 'This invitation has already been used or has expired' }, { status: 410 })
  }
  if (new Date(inv.expires_at) < new Date()) {
    await admin.from('employer_invitations').update({ status: 'expired' }).eq('id', inv.id)
    return NextResponse.json({ error: 'This invitation link has expired' }, { status: 410 })
  }

  // Create Supabase auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: inv.email,
    password,
    email_confirm: true,
  })

  if (authErr || !authData.user) {
    if (authErr?.message?.includes('already been registered')) {
      return NextResponse.json({ error: 'An account with this email already exists. Please sign in instead.' }, { status: 409 })
    }
    return NextResponse.json({ error: authErr?.message ?? 'Failed to create account' }, { status: 500 })
  }

  // Create family_members row linked to employer account
  const { error: fmErr } = await admin.from('family_members').insert({
    supabase_auth_id: authData.user.id,
    full_name: full_name.trim(),
    email: inv.email,
    role: 'family',
    employer_account_id: inv.employer_account_id,
  })

  if (fmErr) {
    // Roll back auth user creation on failure
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Failed to set up account' }, { status: 500 })
  }

  // Mark invitation accepted
  await admin.from('employer_invitations').update({
    status: 'accepted',
    accepted_at: new Date().toISOString(),
    accepted_by_auth_id: authData.user.id,
  }).eq('id', inv.id)

  return NextResponse.json({ success: true, email: inv.email })
}
