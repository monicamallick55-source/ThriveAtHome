// app/api/invitations/[id]/route.ts
// G5.7 — Revoke or resend an invitation

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// DELETE /api/invitations/[id] — revoke an invitation
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const { data: isStaff } = await supabase.rpc('is_staff')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any as any

  const { data: inv } = await db
    .from('family_invitations')
    .select('id, member_id')
    .eq('id', id)
    .maybeSingle()

  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isStaff && inv.member_id !== fm?.member_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db
    .from('family_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
