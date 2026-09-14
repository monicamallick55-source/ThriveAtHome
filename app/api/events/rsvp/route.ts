import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { rsvpToEvent, cancelEventRsvp, joinEventWaitlist, leaveEventWaitlist } from '@/lib/data/events'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) {
    return NextResponse.json(
      { error: 'To RSVP to events, please sign in with a family account that has a linked senior profile.' },
      { status: 400 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { eventId, action } = body as { eventId?: string; action?: 'rsvp' | 'cancel' | 'join_waitlist' | 'leave_waitlist' }

  if (!eventId || !action) return NextResponse.json({ error: 'eventId and action required' }, { status: 400 })

  if (action === 'rsvp') {
    const { error, full } = await rsvpToEvent(eventId, fm.member_id)
    if (full) return NextResponse.json({ error: error ?? 'This event is full.', full: true }, { status: 409 })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'cancel') {
    const { error } = await cancelEventRsvp(eventId, fm.member_id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'join_waitlist') {
    const { error } = await joinEventWaitlist(eventId, fm.member_id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true, waitlisted: true })
  }

  if (action === 'leave_waitlist') {
    const { error } = await leaveEventWaitlist(eventId, fm.member_id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
