import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    const { adminId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: self } = await supabase.from('org_admins').select('org_id, role').eq('user_id', user.id).single()
    if (!self) return NextResponse.json({ error: 'Not an org admin' }, { status: 403 })
    if (self.role === 'viewer') return NextResponse.json({ error: 'Viewers cannot remove admins' }, { status: 403 })
    const { data: target } = await supabase.from('org_admins').select('id, role, user_id, org_id').eq('id', adminId).single()
    if (!target || target.org_id !== self.org_id) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    if (target.role === 'owner') return NextResponse.json({ error: 'Cannot remove the organization owner' }, { status: 403 })
    if (target.user_id === user.id) return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 403 })
    const { error } = await supabase.from('org_admins').delete().eq('id', adminId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
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
    const { data: self } = await supabase.from('org_admins').select('org_id, role').eq('user_id', user.id).single()
    if (!self) return NextResponse.json({ error: 'Not an org admin' }, { status: 403 })
    if (self.role !== 'owner') return NextResponse.json({ error: 'Only owners can change roles' }, { status: 403 })
    const { role } = await req.json()
    if (!['admin', 'viewer'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    const { data: target } = await supabase.from('org_admins').select('id, role, org_id').eq('id', adminId).single()
    if (!target || target.org_id !== self.org_id) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    if (target.role === 'owner') return NextResponse.json({ error: 'Cannot change owner role' }, { status: 403 })
    const { data, error } = await supabase.from('org_admins').update({ role }).eq('id', adminId).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ admin: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
