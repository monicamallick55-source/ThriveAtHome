// POST /api/member/buddy-request — lets a member (direct-auth senior or family member)
// send a special matching request or ask for an update on their Human Buddy match.
// Creates a navigator_tasks row so a real person follows up; no AI auto-match yet.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getMemberByDirectAuth } from '@/lib/data/members'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveMemberId(authUserId: string): Promise<string | null> {
  const directMember = await getMemberByDirectAuth(authUserId)
  if (directMember.data) return directMember.data.id
  const { data: fm } = await getFamilyMemberByAuthId(authUserId)
  return fm?.member_id ?? null
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberId = await resolveMemberId(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { kind, message } = body as { kind?: string; message?: string }
  if (kind !== 'special_request' && kind !== 'update_request') {
    return NextResponse.json({ error: 'kind must be special_request or update_request' }, { status: 400 })
  }
  if (kind === 'special_request' && (!message || !message.trim())) {
    return NextResponse.json({ error: 'message is required for a special request' }, { status: 400 })
  }

  const admin = createAdminClient()
  const description = kind === 'update_request'
    ? 'Member is asking for an update on their Human Buddy match status.'
    : `Buddy matching special request: ${message!.trim()}`

  const { error } = await (admin.from as any)('navigator_tasks').insert({
    member_id: memberId,
    task_type: kind === 'update_request' ? 'buddy_update_request' : 'buddy_special_request',
    description,
    priority: 'medium',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
