import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (user.app_metadata?.role ?? user.user_metadata?.role ?? '') as string
  if (!['navigator', 'admin', 'super_admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  if (!body.plan_type || !body.member_id) {
    return NextResponse.json({ error: 'plan_type and member_id required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.from('navigator_tasks').insert({
    navigator_id: user.id,
    member_id: body.member_id,
    type: body.plan_type,
    status: 'open',
    notes: body.notes ?? '',
    created_at: new Date().toISOString(),
  }).select('id').single()

  return NextResponse.json({ ok: !error, task_id: data?.id, plan_type: body.plan_type })
}
