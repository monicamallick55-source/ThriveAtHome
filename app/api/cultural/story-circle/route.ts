// M25 Phase 104 — Cultural Story Circle: add a festival memory, optionally
// saving it into the member's Life Story archive.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { addStoryContribution } from '@/lib/data/cultural'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'Please complete onboarding first.' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  const b = body as Record<string, unknown>

  const storyText = typeof b.story_text === 'string' ? b.story_text.trim() : ''
  if (storyText.length < 10) return NextResponse.json({ error: 'Please write a little more about your memory.' }, { status: 400 })

  const { data, error } = await addStoryContribution({
    memberId: fm.member_id,
    sessionId: typeof b.session_id === 'string' && b.session_id ? b.session_id : null,
    festivalName: typeof b.festival_name === 'string' ? b.festival_name.slice(0, 120) || null : null,
    homeland: typeof b.homeland === 'string' ? b.homeland.slice(0, 120) || null : null,
    storyText: storyText.slice(0, 6000),
    saveToLifeStory: b.save_to_life_story === true,
    createdByFamilyId: fm.id,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ contribution: data }, { status: 201 })
}
