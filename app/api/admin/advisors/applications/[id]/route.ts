// Admin — review a single advisor listing application (Phase 98, M24).
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { approveAdvisorApplication, setAdvisorApplicationStatus } from '@/lib/data/advisors'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  const reviewedBy = fm?.id ?? null

  const body = await req.json().catch(() => null)
  const action = (body as Record<string, unknown> | null)?.action
  const b = (body as Record<string, unknown> | null) ?? {}

  if (action === 'approve') {
    const overrides: Record<string, unknown> = {}
    for (const k of ['listing_tier', 'city', 'state', 'service_states', 'service_metros', 'bio', 'website', 'languages']) {
      if (k in b) overrides[k] = b[k]
    }
    const { data, error } = await approveAdvisorApplication(id, reviewedBy, overrides)
    if (error) return NextResponse.json({ error }, { status: 400 })
    return NextResponse.json({ advisor: data })
  }

  if (action === 'reject' || action === 'reviewing') {
    const notes = typeof b.review_notes === 'string' ? b.review_notes : null
    const status = action === 'reject' ? 'rejected' : 'reviewing'
    const { error } = await setAdvisorApplicationStatus(id, status, reviewedBy, notes)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
