import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserRole } from '@/lib/auth'
import { createEvent } from '@/lib/data/events'
import type { EventFormat } from '@/types/database'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id)
  if (role !== 'admin' && role !== 'navigator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const {
    title, description, event_type, host_name, event_date, event_time,
    timezone, duration_minutes, format, dial_in_number, dial_in_code,
    video_link, location_address, max_capacity, is_recurring, recurrence_pattern,
  } = body

  if (!title || !event_date || !event_time || !format) {
    return NextResponse.json({ error: 'title, event_date, event_time, and format are required' }, { status: 400 })
  }

  const { data, error } = await createEvent({
    title,
    description: description || null,
    event_type: event_type || 'general',
    host_name: host_name || null,
    event_date,
    event_time,
    timezone: timezone || 'America/New_York',
    duration_minutes: duration_minutes || 60,
    format: format as EventFormat,
    dial_in_number: dial_in_number || null,
    dial_in_code: dial_in_code || null,
    video_link: video_link || null,
    location_address: location_address || null,
    max_capacity: max_capacity || null,
    is_recurring: is_recurring || false,
    recurrence_pattern: recurrence_pattern || null,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ event: data })
}
