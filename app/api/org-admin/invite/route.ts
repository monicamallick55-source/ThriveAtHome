// POST /api/org-admin/invite — invite a co-admin to this org
// GET  /api/org-admin/invite — list pending invitations for this org
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getUserRole } from '@/lib/auth'
import { emailProvider } from '@/lib/providers'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function getOrgForAdmin(authId: string): Promise<string | null> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from as any)('family_members')
    .select('org_id')
    .eq('supabase_auth_id', authId)
    .maybeSingle()
  return data?.org_id ?? null
}

export async function GET() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (!['org_admin', 'admin'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const orgId = await getOrgForAdmin(user.id)
  if (!orgId) return NextResponse.json({ error: 'No org linked to your account' }, { status: 404 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from as any)('role_invitations')
    .select('id, email, status, created_at, expires_at, invited_by_name')
    .eq('org_id', orgId)
    .eq('role', 'org_admin')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invitations: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (!['org_admin', 'admin'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const orgId = await getOrgForAdmin(user.id)
  if (!orgId) return NextResponse.json({ error: 'No org linked to your account' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  const { data: fm } = await db.from('family_members').select('full_name').eq('supabase_auth_id', user.id).maybeSingle()
  const inviterName = fm?.full_name ?? 'Org Admin'

  const { data: existing } = await db.from('role_invitations')
    .select('id, expires_at')
    .eq('org_id', orgId).eq('email', email).eq('role', 'org_admin').eq('status', 'pending')
    .maybeSingle()
  if (existing && new Date(existing.expires_at) > new Date()) {
    return NextResponse.json({ error: 'A pending invitation already exists for that email.' }, { status: 409 })
  }

  const { data: org } = await db.from('community_orgs').select('name').eq('id', orgId).maybeSingle()
  const orgName = org?.name ?? 'your organization'

  const token = Array.from(crypto.getRandomValues(new Uint8Array(20)))
    .map((b: number) => b.toString(16).padStart(2, '0')).join('')

  const { data: inv, error: invErr } = await db.from('role_invitations')
    .insert({ email, role: 'org_admin', org_id: orgId, invited_by_auth: user.id, invited_by_name: inviterName, token, status: 'pending' })
    .select().single()

  if (invErr || !inv) return NextResponse.json({ error: 'Could not create the invitation.' }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const acceptUrl = `${baseUrl}/invite/${token}`

  try {
    await emailProvider.sendOrgAdminInvite(email, orgName, inviterName, acceptUrl)
  } catch {
    console.log(`[org-admin/invite] token for ${email}: ${token} acceptUrl: ${acceptUrl}`)
  }

  return NextResponse.json({ ok: true, invitation_id: inv.id, accept_url: acceptUrl }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (!['org_admin', 'admin'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const orgId = await getOrgForAdmin(user.id)
  if (!orgId) return NextResponse.json({ error: 'No org linked' }, { status: 404 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from as any)('role_invitations')
    .update({ status: 'revoked' }).eq('id', id).eq('org_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
