/**
 * app/api/org-admin/admins/[adminId]/route.ts
 *
 * DELETE /api/org-admin/admins/[adminId] — remove an admin (owner only; can't remove self)
 * PATCH  /api/org-admin/admins/[adminId] — change role (owner only)
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    const { adminId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: self } = await supabase
      .from('org_admins')
      .select('org_id, role, id')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!self) return NextResponse.json({ error: 'Not an org admin' }, { status: 403 })
    if (self.role !== 'owner' && self.role !== 'admin') {
      return NextResponse.json({ error: 'Only owners/admins can remove admins' }, { status: 403 })
    }
    if (self.id === adminId) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
    }

    // Verify the target admin belongs to same org
    const { data: target } = await supabase
      .from('org_admins')
      .select('id, role, org_id')
      .eq('id', adminId)
      .single()

    if (!target || target.org_id !== self.org_id) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }
    if (target.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the organization owner' }, { status: 403 })
    }

    const { error } = await supabase.from('org_admins').delete().eq('id', adminId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ removed: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    const { adminId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: self } = await supabase
      .from('org_admins')
      .select('org_id, role')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!self || self.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can change admin roles' }, { status: 403 })
    }

    const { role } = await req.json()
    if (!['admin', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('org_admins')
      .update({ role })
      .eq('id', adminId)
      .eq('org_id', self.org_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ admin: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
