// FEATURE-006 — after a member saves a life-story memory, ask Claude for two
// short follow-up questions to help them keep going.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { aiProvider } from '@/lib/providers'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  let body: { entry?: string; title?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const entry = body.entry?.trim()
  if (!entry) return NextResponse.json({ error: 'entry is required' }, { status: 400 })

  const followups = await aiProvider.generateLifeStoryFollowups(body.title?.trim() ?? '', entry.slice(0, 4000))
  return NextResponse.json({ followups })
}
