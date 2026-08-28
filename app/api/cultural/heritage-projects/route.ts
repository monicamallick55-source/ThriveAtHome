// M25 Phase 105 — Intergenerational Heritage Event: an elder offers to share a
// tradition with a student for a school project. Creates a navigator match task.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createHeritageProject } from '@/lib/data/cultural'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'Please complete onboarding first.' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  const b = body as Record<string, unknown>

  const traditionTopic = typeof b.tradition_topic === 'string' ? b.tradition_topic.trim() : ''
  if (traditionTopic.length < 3) return NextResponse.json({ error: 'Please describe the tradition you would like to share.' }, { status: 400 })

  const { data, error } = await createHeritageProject({
    memberId: fm.member_id,
    traditionTopic: traditionTopic.slice(0, 200),
    schoolName: typeof b.school_name === 'string' ? b.school_name.slice(0, 160) || null : null,
    projectDescription: typeof b.project_description === 'string' ? b.project_description.slice(0, 2000) || null : null,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ project: data }, { status: 201 })
}
