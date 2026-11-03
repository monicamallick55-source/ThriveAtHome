// Admin API: create and list circle_events.
// POST /api/admin/events   — create event (geocodes zip automatically)
// GET  /api/admin/events   — list all events, newest first
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { geocodeZip } from './geocode'

const db = () => createAdminClient()

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
      event_time?: string
      location?: string
      zip_code?: string
      circle_id?: string
      circle_ids?: string[]
      format?: string
      is_platform_wide?: boolean
      is_recurring?: boolean
      video_link?: string
      dial_in_number?: string
      dial_in_code?: string
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
        event_time: body.event_time ?? null,
        location_address: body.location?.trim() ?? null,
        zip_code: body.zip_code?.trim() ?? null,
        latitude,
        longitude,
        circle_id: body.circle_id ?? null,
        circle_ids: body.circle_ids ?? null,
        format: body.format ?? 'phone_only',
        is_platform_wide: body.is_platform_wide ?? false,
        is_recurring: body.is_recurring ?? false,
        video_link: body.video_link?.trim() ?? null,
        dial_in_number: body.dial_in_number?.trim() ?? null,
        dial_in_code: body.dial_in_code?.trim() ?? null,
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
