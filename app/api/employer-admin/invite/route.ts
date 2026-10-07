import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getUserRole } from '@/lib/auth'
import { emailProvider } from '@/lib/providers'

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'employer_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const email = (body.email ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get employer account for this admin
  const { data: adminRow } = await admin
    .from('family_members')
    .select('employer_account_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!adminRow?.employer_account_id) {
    return NextResponse.json({ error: 'No employer account linked' }, { status: 404 })
  }

  const employerId = adminRow.employer_account_id

  // Check for existing pending invitation to the same email
  const { data: existing } = await admin
    .from('employer_invitations')
    .select('id, status, expires_at')
    .eq('employer_account_id', employerId)
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing && new Date(existing.expires_at) > new Date()) {
    return NextResponse.json(
      { error: 'A pending invitation already exists for this email' },
      { status: 409 }
    )
  }

  // Generate a secure token (128-bit hex)
  const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b: any) => b.toString(16).padStart(2, '0'))
    .join('')

  const { data: inv, error: invErr } = await admin
    .from('employer_invitations')
    .insert({
      employer_account_id: employerId,
      invited_by_auth_id: user.id,
      email,
      token,
      status: 'pending',
    })
    .select()
    .single()

  if (invErr || !inv) {
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
  }

  const { data: account } = await admin
    .from('employer_accounts')
    .select('company_name')
    .eq('id', employerId)
    .maybeSingle()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const acceptUrl = `${baseUrl}/employer-admin/invite/${token}`

  await emailProvider.sendEmployeeInvitation(
    email,
    account?.company_name ?? 'Your Employer',
    acceptUrl
  )

  return NextResponse.json({
    success: true,
    invitation_id: inv.id,
    accept_url: acceptUrl,
  })
}
