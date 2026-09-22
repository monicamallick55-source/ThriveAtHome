// FEATURE-003 — "I'm going" attendance for live-searched festival results.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { joinLiveEvent, leaveLiveEvent, getLiveEventAttendance } from '@/lib/data/eventSearch'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) {
    return NextResponse.json(
      { error: 'To RSVP to events, please sign in with a family account that has a linked senior profile.' },
      { status: 400 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { url, title, date, action } = body as {
    url?: string; title?: string; date?: string; action?: 'join' | 'leave'
  }
  if (!url || !action || (action === 'join' && !title)) {
    return NextResponse.json({ error: 'url, title, and action are required' }, { status: 400 })
  }

  if (action === 'join') {
    const { error } = await joinLiveEvent(memberId, url, title!, date ?? 'Check listing')
    if (error) return NextResponse.json({ error: 'Could not save your RSVP. Please try again.' }, { status: 500 })
  } else if (action === 'leave') {
    const { error } = await leaveLiveEvent(memberId, url)
    if (error) return NextResponse.json({ error: 'Could not update your RSVP. Please try again.' }, { status: 500 })
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data } = await getLiveEventAttendance([url], memberId)
  const attendance = data[url] ?? { count: 0, going: false }
  return NextResponse.json({ success: true, ...attendance })
}
