// Admin API: create and list circle_events.
// POST /api/admin/events   — create event (geocodes zip automatically)
// GET  /api/admin/events   — list all events, newest first
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { geocodeZip } from './geocode'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any

async function requireAdmin() {
  const user = await requireAuth()
  const { data: fm } = await db()
    .from('family_members')
    .select('role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (fm?.role !== 'admin' && fm?.role !== 'navigator') {
    throw new Error('Forbidden')
  }
  return user
}

export async function GET() {
  try {
    await requireAdmin()
    const { data, error } = await db()
      .from('circle_events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(200)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ events: data ?? [] })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 403 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json() as {
      title: string
      description?: string
      event_date: string
      location?: string
      zip_code?: string
      max_attendees?: number
      circle_id?: string
      event_type?: string
      is_virtual?: boolean
      meeting_link?: string
    }

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }
    if (!body.event_date) {
      return NextResponse.json({ error: 'event_date is required' }, { status: 400 })
    }

    // Geocode zip if provided
    let latitude: number | null = null
    let longitude: number | null = null
    if (body.zip_code?.trim()) {
      const geo = await geocodeZip(body.zip_code.trim())
      if (geo) {
        latitude = geo.latitude
        longitude = geo.longitude
      }
    }

    const { data, error } = await db()
      .from('circle_events')
      .insert({
        title: body.title.trim(),
        description: body.description?.trim() ?? null,
        event_date: body.event_date,
        location: body.location?.trim() ?? null,
        zip_code: body.zip_code?.trim() ?? null,
        latitude,
        longitude,
        max_attendees: body.max_attendees ?? null,
        circle_id: body.circle_id ?? null,
        event_type: body.event_type ?? 'general',
        is_virtual: body.is_virtual ?? false,
        meeting_link: body.meeting_link?.trim() ?? null,
      })
      .select('*')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ event: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 403 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json() as {
      id: string
      zip_code?: string
      [key: string]: unknown
    }
    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Re-geocode if zip changed
    const updates: Record<string, unknown> = { ...body }
    delete updates.id

    if (body.zip_code !== undefined) {
      if (body.zip_code?.trim()) {
        const geo = await geocodeZip(body.zip_code.trim())
        updates.latitude = geo?.latitude ?? null
        updates.longitude = geo?.longitude ?? null
      } else {
        updates.latitude = null
        updates.longitude = null
      }
    }

    const { data, error } = await db()
      .from('circle_events')
      .update(updates)
      .eq('id', body.id)
      .select('*')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ event: data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 403 })
  }
}
