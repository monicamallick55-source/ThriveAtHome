// M27 Phase 119 — The Companion Circle feed: read recent posts, add a post.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { getPetLossPosts, createPetLossPost, getPetLossMembership } from '@/lib/data/pet-loss'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ posts: [] })

  const { data: membership } = await getPetLossMembership(memberId)
  if (!membership?.is_active) {
    return NextResponse.json({ error: 'Join the circle to see the feed.', posts: [] }, { status: 403 })
  }
  const { data, error } = await getPetLossPosts()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ posts: data })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 400 })

  const { data: membership } = await getPetLossMembership(memberId)
  if (!membership?.is_active) {
    return NextResponse.json({ error: 'Join the circle before posting.' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const b = body as Record<string, unknown>
  if (typeof b.content !== 'string' || !b.content.trim()) {
    return NextResponse.json({ error: 'Write a few words to share with the circle.' }, { status: 400 })
  }

  const { data, error } = await createPetLossPost(
    memberId,
    membership.display_name,
    b.content,
    typeof b.post_type === 'string' ? b.post_type : 'reflection'
  )
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ post: data }, { status: 201 })
}
