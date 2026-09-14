import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { need_type, title, description, urgency = 'normal', preferred_date, community_context } = body
  if (!need_type || !title || !description) {
    return NextResponse.json({ error: 'need_type, title, description required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Find member ID and org_id via family_members or direct member
  let memberId: string | null = null
  let orgId: string | null = null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: directMember } = await (admin.from as any)('members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (directMember?.id) {
    memberId = directMember.id
  }

  const { data: fm } = await admin
    .from('family_members')
    .select('member_id, org_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (fm?.member_id && !memberId) memberId = fm.member_id
  if (fm?.org_id) orgId = fm.org_id

  if (!memberId) return NextResponse.json({ error: 'No member found' }, { status: 404 })
  if (!orgId) return NextResponse.json({ error: 'You are not linked to a community organization' }, { status: 400 })

  const { data, error } = await (admin.from as any)('member_needs').insert({
    member_id: memberId,
    org_id: orgId,
    need_type,
    title,
    description,
    urgency,
    preferred_date: preferred_date || null,
    community_context: (typeof community_context === 'string' && community_context.trim()) ? community_context.trim() : null,
    status: 'open',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
