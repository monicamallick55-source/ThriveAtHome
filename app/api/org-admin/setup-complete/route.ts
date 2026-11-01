import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const result = await db
    .from('family_members' as any)
    .select('org_id, role')
    .eq('supabase_auth_id', user.id)
    .in('role', ['org_admin', 'admin'])
    .single()
  const member = (result as any).data as { org_id: string; role: string } | null

  if (!member?.org_id) return NextResponse.json({ error: 'Not an org admin' }, { status: 403 })

  const updateResult = await db
    .from('community_orgs' as any)
    .update({ setup_completed_at: new Date().toISOString() })
    .eq('id', member.org_id)
  const error = (updateResult as any).error

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
