// Member-initiated check-in request.
// For members who have opted out of Aria's AI calls, this lets them ask their
// human care navigator to call them personally. Creates a navigator task.
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Resolve member — direct auth first, then family_members linkage
  let memberId: string | null = null
  let memberName = 'A member'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: directMember } = await (admin.from as any)('members')
    .select('id, preferred_name')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (directMember?.id) {
    memberId = directMember.id
    memberName = directMember.preferred_name ?? memberName
  } else {
    const { data: fm } = await admin
      .from('family_members')
      .select('member_id')
      .eq('supabase_auth_id', user.id)
      .maybeSingle()
    if (fm?.member_id) {
      memberId = fm.member_id
      const { data: m } = await admin
        .from('members')
        .select('preferred_name')
        .eq('id', fm.member_id)
        .maybeSingle()
      memberName = m?.preferred_name ?? memberName
    }
  }

  if (!memberId) return NextResponse.json({ error: 'No member found' }, { status: 404 })

  // Attach to the assigned navigator if there is one
  const { data: assignment } = await admin
    .from('navigator_assignments')
    .select('navigator_id')
    .eq('member_id', memberId)
    .limit(1)
    .maybeSingle()

  const dueBy = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await admin.from('navigator_tasks').insert({
    member_id: memberId,
    navigator_id: assignment?.navigator_id ?? null,
    task_type: 'checkin_request',
    description: `${memberName} requested a personal check-in call from their care navigator.`,
    priority: 'medium',
    due_by: dueBy,
    completed: false,
  })

  if (error) {
    console.error('[api/member/request-checkin] insert failed:', error)
    return NextResponse.json({ error: 'Could not send your request. Please try again.' }, { status: 500 })
  }

  console.log(`[member/request-checkin] ${memberName} (${memberId}) asked for a navigator check-in call.`)
  return NextResponse.json({ success: true })
}
