import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { rsvpToCircleEvent, cancelRsvpToCircleEvent } from '@/lib/data/circles'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const { eventId, cancel } = await request.json()
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })

  const ok = cancel
    ? await cancelRsvpToCircleEvent(memberId, eventId)
    : await rsvpToCircleEvent(memberId, eventId)

  if (!ok) return NextResponse.json({ error: 'RSVP action failed' }, { status: 500 })

  return NextResponse.json({ success: true })
}
