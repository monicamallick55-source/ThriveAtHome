import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, org_id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!fm.org_id) return NextResponse.json({ data: [] })

  const { data } = await (admin.from as any)('org_sent_emails')
    .select('id, created_at, subject, recipient_group, recipient_count, sent_by_name')
    .eq('org_id', fm.org_id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ data: data ?? [] })
}
