import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const admin = createAdminClient()
  const db = admin as any

  // Resolve member id
  const { data: member } = await db.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle()
  const memberId = member?.id ?? user.id

  const taskType = body.kind === 'update_request' ? 'buddy_update_request' : 'buddy_special_request'
  const description = body.message?.trim() || body.preferences?.trim() || `Buddy request: ${body.buddy_type || 'general'}`

  const { data, error } = await db.from('navigator_tasks').insert({
    member_id: memberId,
    task_type: taskType,
    description,
    priority: 'medium',
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id: data?.id })
}
