import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (!body.advisor_role) return NextResponse.json({ error: 'advisor_role required' }, { status: 400 })

  const VALID_ROLES = ['therapist', 'elder_law_attorney', 'financial_advisor', 'chaplain', 'grief_counselor']
  if (!VALID_ROLES.includes(body.advisor_role)) {
    return NextResponse.json({ error: 'Invalid advisor_role' }, { status: 400 })
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

  return NextResponse.json({ ok: !error, advisor_role: body.advisor_role, status: 'pending' })
}
