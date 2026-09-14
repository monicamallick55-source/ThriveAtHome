// Revoke a pending role invitation. The inviter or any admin may revoke.
import { NextResponse } from 'next/server'
import { getCurrentUser, getUserRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  const { data: inv } = await db.from('role_invitations')
    .select('id, invited_by_auth, status')
    .eq('id', id)
    .maybeSingle()
  if (!inv) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })

  const role = await getUserRole(user.id)
  if (inv.invited_by_auth !== user.id && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (inv.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending invitations can be revoked.' }, { status: 409 })
  }

  const { error } = await db.from('role_invitations').update({ status: 'revoked' }).eq('id', id)
  if (error) return NextResponse.json({ error: 'Could not revoke.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
