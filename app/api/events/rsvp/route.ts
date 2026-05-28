import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { rsvpToEvent, cancelEventRsvp } from '@/lib/data/events'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await getMemberForAuthUser(user.id)
  if (!member) return NextResponse.json({ error: 'No member linked to this account' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const { eventId, action } = body as { eventId?: string; action?: 'rsvp' | 'cancel' }

  if (!eventId || !action) return NextResponse.json({ error: 'eventId and action required' }, { status: 400 })

  if (action === 'rsvp') {
    const { error } = await rsvpToEvent(eventId, member.id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'cancel') {
    const { error } = await cancelEventRsvp(eventId, member.id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
