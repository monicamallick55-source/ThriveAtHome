import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('family_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .in('role', ['org_admin', 'admin'])
    .single()

  if (!member?.org_id) {
    return NextResponse.json({ error: 'Not an org admin' }, { status: 403 })
  }

  const { error } = await supabase
    .from('community_orgs')
    .update({ setup_completed_at: new Date().toISOString() })
    .eq('id', member.org_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
