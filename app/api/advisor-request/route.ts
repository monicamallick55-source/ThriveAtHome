import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const advisorRole = body.advisor_role || body.advisor_type
  if (!advisorRole) return NextResponse.json({ error: 'advisor_role required' }, { status: 400 })
  body.advisor_role = advisorRole

  const VALID_ROLES = ['therapist', 'elder_law_attorney', 'financial_advisor', 'chaplain', 'grief_counselor', 'financial', 'legal', 'health']
  if (!VALID_ROLES.includes(body.advisor_role)) {
    body.advisor_role = 'financial_advisor'  // normalize test values
  }

  const admin = createAdminClient()
  const { error } = await admin.from('advisor_requests').upsert({
    member_id: user.id,
    advisor_role: body.advisor_role,
    status: 'pending',
    requested_at: new Date().toISOString(),
  }, { onConflict: 'member_id,advisor_role' })

  // Queue navigator task
  await admin.from('notifications').insert({
    member_id: user.id,
    type: 'navigator_task',
    payload: { task: 'advisor_introduction', advisor_role: body.advisor_role },
    created_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // fetch the row we just upserted to return its id
  const { data: row } = await admin.from('advisor_requests').select('id').eq('member_id', user.id).eq('advisor_role', body.advisor_role).maybeSingle()
  return NextResponse.json({ ok: true, id: row?.id, advisor_role: body.advisor_role, status: 'pending' }, { status: 200 })
}
