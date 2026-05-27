import { NextResponse } from 'next/server'
import { getCurrentUser, getUserRole } from '@/lib/auth'
import { createCircleEvent } from '@/lib/data/circles'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id)
  if (role !== 'admin' && role !== 'navigator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { title, event_date, is_platform_wide } = body
  const circleIds = Array.isArray(body.circle_ids) ? (body.circle_ids as string[]) : []

  if (!title || !event_date) {
    return NextResponse.json({ error: 'title and event_date are required' }, { status: 400 })
  }
  if (!is_platform_wide && circleIds.length === 0) {
    return NextResponse.json({ error: 'Select at least one circle or mark as platform-wide' }, { status: 400 })
  }

  const event = await createCircleEvent({
    circle_id: circleIds[0] ?? null,
    circle_ids: circleIds,
    title: body.title as string,
    event_date: body.event_date as string,
    description: body.description as string | undefined,
    event_time: body.event_time as string | undefined,
    format: body.format as string | undefined,
    dial_in_number: body.dial_in_number as string | undefined,
    dial_in_code: body.dial_in_code as string | undefined,
    video_link: body.video_link as string | undefined,
    location_address: body.location_address as string | undefined,
    is_platform_wide: body.is_platform_wide as boolean | undefined,
    is_recurring: body.is_recurring as boolean | undefined,
  })
  if (!event) return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })

  return NextResponse.json({ event })
}
