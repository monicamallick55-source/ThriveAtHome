import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: self } = await supabase.from('org_admins').select('org_id').eq('supabase_auth_id', user.id).single()
    if (!self) return NextResponse.json({ error: 'Not an org admin' }, { status: 403 })
    const { data, error } = await supabase.from('org_admins').select('id, role, created_at, user:user_profiles(id, full_name, email)').eq('org_id', self.org_id).order('created_at')
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    const admins = (data ?? []).map((a: any) => ({ id: a.id, role: a.role, added_at: a.created_at, name: a.user?.full_name ?? 'Pending', email: a.user?.email ?? '—' }))
    return NextResponse.json({ admins })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: self } = await supabase.from('org_admins').select('org_id, role').eq('supabase_auth_id', user.id).single()
    if (!self) return NextResponse.json({ error: 'Not an org admin' }, { status: 403 })
    if (self.role === 'viewer') return NextResponse.json({ error: 'Viewers cannot invite admins' }, { status: 403 })
    const body = await req.json()
    const { email, role = 'admin' } = body
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    if (!['admin', 'viewer'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    const { data: invitedUser } = await supabase.from('user_profiles').select('id').eq('email', email).single()
    if (!invitedUser) {
      await supabase.from('org_admin_invitations').insert({ org_id: self.org_id, email, role, invited_by: user.id, status: 'pending' })
      return NextResponse.json({ invited: true, pending_signup: true }, { status: 201 })
    }
    const { data: existing } = await supabase.from('org_admins').select('id').eq('org_id', self.org_id).eq('user_id', invitedUser.id).single()
    if (existing) return NextResponse.json({ error: 'User is already an admin of this organization' }, { status: 409 })
    const { data, error } = await supabase.from('org_admins').insert({ org_id: self.org_id, user_id: invitedUser.id, role, invited_by: user.id }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ admin: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
