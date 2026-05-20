// Family task API — creates a task for the authenticated user's member.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createFamilyTask } from '@/lib/data/tasks'

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // 2. Parse body
  let body: { memberId?: string; title?: string; taskType?: string; dueDate?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { memberId, title, taskType, dueDate } = body
  if (!memberId || !title || typeof title !== 'string' || title.trim() === '') {
    return NextResponse.json({ error: 'memberId and title are required' }, { status: 400 })
  }

  // 3. Authorise: confirm this user is linked to the requested member and get family_member id
  const admin = createAdminClient()
  const { data: fm, error: fmError } = await admin
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .eq('member_id', memberId)
    .maybeSingle()

  if (fmError) {
    console.error('[api/tasks] family_members check:', fmError)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
  if (!fm) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Create task
  const { data: task, error: taskError } = await createFamilyTask({
    memberId,
    createdBy: fm.id,
    title: title.trim(),
    taskType: typeof taskType === 'string' ? taskType : 'other',
    dueDate: dueDate ?? null,
  })

  if (taskError || !task) {
    return NextResponse.json({ error: taskError ?? 'Failed to create task' }, { status: 500 })
  }

  return NextResponse.json({ task }, { status: 201 })
}
