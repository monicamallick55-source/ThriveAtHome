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

  const body = await request.json()
  const { circle_id, title, event_date } = body
  if (!circle_id || !title || !event_date) {
    return NextResponse.json({ error: 'circle_id, title, event_date required' }, { status: 400 })
  }

  const event = await createCircleEvent(body)
  if (!event) return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })

  return NextResponse.json({ event })
}
