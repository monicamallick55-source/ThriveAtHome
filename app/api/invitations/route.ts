// Role invitations — create and list.
// POST: an authorised inviter (admin / navigator / org_admin) invites someone to a
//       staff or partner role. The target role must be allowed for the caller
//       (see INVITABLE_BY). Scope links (org_id, agency_id, …) are copied from the
//       caller so the accepted account lands in the right place.
// GET:  the invitations the caller is allowed to see.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserRole, isNavigatorOrAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { canInvite, ROLE_LABEL } from '@/lib/roles'
import { emailProvider } from '@/lib/providers'
import type { UserRole } from '@/lib/auth'

function genToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(20)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const role = await getUserRole(user.id)

  let query = (admin.from('role_invitations') as any)
    .select('id, email, role, status, created_at, expires_at, accepted_at, invited_by_name, note, org_id')
    .order('created_at', { ascending: false })
    .limit(200)

  // Admins see everything; everyone else sees only what they sent.
  if (role !== 'admin') query = (query as any).eq('invited_by_auth', user.id)

  const { data, error } = await query
  if (error) {
    console.error('[api/invitations GET]', error)
    return NextResponse.json({ invitations: [] })
  }
  return NextResponse.json({ invitations: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve the caller's effective role. care_navigators logins often have no
  // family_members.role, so fall back to the navigator check.
  let callerRole = await getUserRole(user.id)
  if (!callerRole && (await isNavigatorOrAdmin(user.id))) callerRole = 'navigator'
  if (!callerRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const email = String(body?.email ?? '').trim().toLowerCase()
  const targetRole = String(body?.role ?? '').trim()
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : null

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }
  if (!canInvite(callerRole, targetRole)) {
    return NextResponse.json({ error: `You are not allowed to invite a ${targetRole || 'that role'}.` }, { status: 403 })
  }

  const admin = createAdminClient()

  // Copy the caller's scope links so the new account is correctly attached.
  const { data: callerFm } = await (admin.from('family_members') as any)
    .select('full_name, org_id, agency_id, employer_account_id, senior_center_id, aaa_id, network_id, university_name')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  // Reject an active duplicate.
  const { data: dupe } = await (admin.from('role_invitations') as any)
    .select('id, expires_at')
    .eq('email', email)
    .eq('role', targetRole)
    .eq('status', 'pending')
    .maybeSingle()
  if (dupe && new Date(dupe.expires_at) > new Date()) {
    return NextResponse.json({ error: 'There is already a pending invitation for this email and role.' }, { status: 409 })
  }

  const token = genToken()
  const scoped: Record<string, unknown> = {}
  // Volunteer / org_admin invitations from an org admin stay scoped to that org.
  if (targetRole === 'volunteer' || targetRole === 'org_admin') {
    if (callerFm?.org_id) scoped.org_id = callerFm.org_id
  }
  if (callerRole === 'admin') {
    // An admin may pass explicit scope links.
    for (const k of ['org_id', 'agency_id', 'employer_account_id', 'senior_center_id', 'aaa_id', 'network_id']) {
      if (body?.[k]) scoped[k] = body[k]
    }
    if (typeof body?.university_name === 'string' && body.university_name.trim()) {
      scoped.university_name = body.university_name.trim()
    }
  }

  const { data: inv, error } = await (admin.from('role_invitations') as any).insert({
    email,
    role: targetRole,
    invited_by_auth: user.id,
    invited_by_name: callerFm?.full_name ?? null,
    note,
    token,
    status: 'pending',
    ...scoped,
  }).select('id, token, role, email').single()

  if (error || !inv) {
    console.error('[api/invitations POST]', error)
    return NextResponse.json({ error: 'Could not create the invitation.' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const acceptUrl = `${baseUrl}/invite/${token}`
  try {
    await emailProvider.sendWelcome(
      email,
      `${ROLE_LABEL[targetRole as UserRole] ?? 'team member'} — set up your ThriveAtHome account: ${acceptUrl}`
    )
    console.log(`[STUB][Email] Role invitation (${targetRole}) sent to ${email}: ${acceptUrl}`)
  } catch (e) {
    console.warn('[api/invitations POST] invite email stub failed:', e)
  }

  return NextResponse.json({ invitation: { id: inv.id, email: inv.email, role: inv.role }, accept_url: acceptUrl }, { status: 201 })
}
