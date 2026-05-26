import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserRole } from '@/lib/auth'
import { confirmVolunteerMatch } from '@/lib/data/volunteers'
import { pushRealtimeNotification } from '@/lib/realtime/notifications'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const role = await getUserRole(user.id)
    if (role !== 'admin' && role !== 'navigator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { memberId, volunteerId, score, reasons } = await req.json()
    if (!memberId || !volunteerId) {
      return NextResponse.json({ error: 'memberId and volunteerId are required' }, { status: 400 })
    }

    const { data, error } = await confirmVolunteerMatch(
      memberId,
      volunteerId,
      score ?? 0,
      reasons ?? []
    )
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    // Push volunteer_matched notification — best-effort
    void pushRealtimeNotification({
      type: 'volunteer_matched',
      memberId,
      title: 'Volunteer match confirmed',
      body: 'A volunteer has been matched with your loved one.',
      severity: 'info',
    })

    return NextResponse.json({ match: data }, { status: 201 })
  } catch (e) {
    console.error('[admin/volunteer-matching/confirm] Unexpected error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
