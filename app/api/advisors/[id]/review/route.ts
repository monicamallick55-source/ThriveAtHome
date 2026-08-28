// Leave a private review for an advisor after a first meeting (Phase 98, M24).
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createAdminClient } from '@/lib/supabase/admin'
import { submitAdvisorReview } from '@/lib/data/advisors'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: advisorId } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked to this account.' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const rating = Number((body as Record<string, unknown> | null)?.rating)
  const reviewText = (body as Record<string, unknown> | null)?.review_text
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Please give a rating between 1 and 5 stars.' }, { status: 400 })
  }

  // Authorise: the member must have an advisor_connection with this advisor.
  const admin = createAdminClient()
  const { data: conn } = await admin
    .from('advisor_connections')
    .select('id')
    .eq('member_id', fm.member_id)
    .eq('advisor_id', advisorId)
    .maybeSingle()
  if (!conn) {
    return NextResponse.json(
      { error: 'You can only review an advisor you have been introduced to.' },
      { status: 403 }
    )
  }

  const { error } = await submitAdvisorReview({
    advisorId,
    memberId: fm.member_id,
    connectionId: conn.id,
    rating,
    reviewText: typeof reviewText === 'string' ? reviewText.trim().slice(0, 2000) || null : null,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
