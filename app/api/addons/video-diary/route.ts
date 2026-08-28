// M26 Phase 109 — Long-Distance Caregiver: private family video diary.
// List and create entries. Gated on an active long_distance_caregiver add-on.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import {
  getVideoDiaryEntries,
  addVideoDiaryEntry,
  hasActiveAddon,
} from '@/lib/data/premium-addons'

export const runtime = 'nodejs'

type Gate =
  | { ok: false; response: NextResponse }
  | { ok: true; memberId: string; familyMemberId: string }

async function requireLongDistance(authId: string): Promise<Gate> {
  const { data: fm } = await getFamilyMemberByAuthId(authId)
  if (!fm?.member_id) {
    return { ok: false, response: NextResponse.json({ error: 'Please complete onboarding first.' }, { status: 400 }) }
  }
  const active = await hasActiveAddon(fm.member_id, 'long_distance_caregiver')
  if (!active) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'The Long-Distance Caregiver add-on is required for the video diary.' },
        { status: 403 }
      ),
    }
  }
  return { ok: true, memberId: fm.member_id, familyMemberId: fm.id }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const gate = await requireLongDistance(user.id)
  if (!gate.ok) return gate.response

  const { data } = await getVideoDiaryEntries(gate.memberId)
  return NextResponse.json({ entries: data })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const gate = await requireLongDistance(user.id)
  if (!gate.ok) return gate.response

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { title, note } = body as Record<string, unknown>
  if (typeof title !== 'string' || title.trim().length < 2) {
    return NextResponse.json({ error: 'Give the entry a short title.' }, { status: 400 })
  }

  const { data, error } = await addVideoDiaryEntry({
    memberId: gate.memberId,
    authorFamilyMemberId: gate.familyMemberId,
    title: title.trim().slice(0, 160),
    note: typeof note === 'string' ? note.trim().slice(0, 2000) || null : null,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ entry: data }, { status: 201 })
}
