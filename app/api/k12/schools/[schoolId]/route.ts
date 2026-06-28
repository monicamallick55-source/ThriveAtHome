// K-12 school management API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ schoolId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role').eq('supabase_auth_id', user.id).maybeSingle()
  if (!fm || !['admin', 'navigator'].includes(fm.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { schoolId } = await params
  let body: { status?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { error } = await admin
    .from('k12_schools')
    .update({ status: body.status ?? 'active' })
    .eq('id', schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
