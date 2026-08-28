// M25 Phase 107 — Oral history archive: create a recording record (metadata +
// optional transcript), optionally mirrored into the Life Story archive.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createOralHistoryRecording } from '@/lib/data/cultural'

export const runtime = 'nodejs'

const VISIBILITIES = new Set(['family', 'circle', 'public'])

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'Please complete onboarding first.' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  const b = body as Record<string, unknown>

  const title = typeof b.title === 'string' ? b.title.trim() : ''
  const language = typeof b.language === 'string' ? b.language.trim() : ''
  if (!title) return NextResponse.json({ error: 'Please give the recording a title.' }, { status: 400 })
  if (!language) return NextResponse.json({ error: 'Please choose the language of the recording.' }, { status: 400 })
  if (b.consent_given !== true) {
    return NextResponse.json({ error: 'Please confirm the storyteller agreed to have this recorded and kept.' }, { status: 400 })
  }
  const visibility = typeof b.visibility === 'string' && VISIBILITIES.has(b.visibility) ? b.visibility : 'family'

  const { data, error } = await createOralHistoryRecording({
    memberId: fm.member_id,
    recordedByFamilyId: fm.id,
    title: title.slice(0, 200),
    language: language.slice(0, 60),
    topic: typeof b.topic === 'string' ? b.topic.slice(0, 120) || null : null,
    era: typeof b.era === 'string' ? b.era.slice(0, 60) || null : null,
    description: typeof b.description === 'string' ? b.description.slice(0, 2000) || null : null,
    transcript: typeof b.transcript === 'string' ? b.transcript.slice(0, 20000) || null : null,
    consentGiven: true,
    visibility,
    saveToLifeStory: b.save_to_life_story === true,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ recording: data }, { status: 201 })
}
