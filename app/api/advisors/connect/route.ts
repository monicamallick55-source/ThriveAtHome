// Request a warm introduction to a trusted advisor (Phase 98, M24).
// Creates an advisor_connections row + a navigator task. Never returns a raw
// phone number — a navigator makes the personal introduction.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdvisorById, requestAdvisorIntroduction } from '@/lib/data/advisors'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) {
    return NextResponse.json(
      { error: 'No member linked to this account. Please complete onboarding first.' },
      { status: 400 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { advisor_id, topic, member_note } = body as {
    advisor_id?: string
    topic?: string
    member_note?: string
  }
  if (!advisor_id || typeof advisor_id !== 'string') {
    return NextResponse.json({ error: 'advisor_id is required' }, { status: 400 })
  }

  const { data: advisor, error: advErr } = await getAdvisorById(advisor_id)
  if (advErr || !advisor) {
    return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
  }
  if (advisor.listing_status !== 'active') {
    return NextResponse.json({ error: 'This advisor is not currently accepting introductions.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select('preferred_name')
    .eq('id', fm.member_id)
    .maybeSingle()

  const { data, error } = await requestAdvisorIntroduction({
    memberId: fm.member_id,
    advisorId: advisor_id,
    requestedBy: fm.id,
    topic: typeof topic === 'string' ? topic.trim().slice(0, 300) || null : null,
    memberNote: typeof member_note === 'string' ? member_note.trim().slice(0, 1000) || null : null,
    memberPreferredName: member?.preferred_name ?? 'The member',
    advisorName: advisor.firm_name ? `${advisor.full_name} (${advisor.firm_name})` : advisor.full_name,
  })
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ connection: data }, { status: 201 })
}
