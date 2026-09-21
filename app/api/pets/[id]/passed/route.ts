// M27 Phase 119 — record that a companion has passed away.
// Deactivates the profile, notifies the family gently, logs a [STUB][EMAIL] care-team notice.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { createAdminClient } from '@/lib/supabase/admin'
import { markPetPassedAway } from '@/lib/data/pets'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const passedAwayOn =
    typeof b.passed_away_on === 'string' && b.passed_away_on ? b.passed_away_on : new Date().toISOString().slice(0, 10)
  const memorialNote = typeof b.memorial_note === 'string' ? b.memorial_note : null

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select('preferred_name')
    .eq('id', memberId)
    .maybeSingle()

  const { data, error } = await markPetPassedAway(
    id,
    memberId,
    passedAwayOn,
    memorialNote,
    member?.preferred_name ?? 'your loved one'
  )
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ pet: data })
}
