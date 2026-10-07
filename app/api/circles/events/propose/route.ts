import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const supabase = await createClient()

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { title, description, event_date, event_time, format, circle_id,
          location_address, location_text, website_link, external_rsvp_url,
          dial_in_number, dial_in_code, video_link } = body as Record<string, string>
  const circle_ids_raw = (body as any).circle_ids

  if (!title || !event_date) {
    return NextResponse.json({ error: 'title and event_date are required' }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
    return NextResponse.json({ error: 'event_date must be YYYY-MM-DD' }, { status: 400 })
  }

  const { data, error } = await (supabase.from as any)('circle_events').insert({
    title,
    description: description ?? null,
    event_date,
    event_time: event_time ?? null,
    format: format ?? null,
    circle_id: circle_id ?? null,
    circle_ids: Array.isArray(circle_ids_raw) ? circle_ids_raw : (circle_id ? [circle_id] : []),
    location_address: location_address ?? null,
    location_text: location_text ?? null,
    website_link: website_link ?? null,
    external_rsvp_url: external_rsvp_url ?? null,
    dial_in_number: dial_in_number ?? null,
    dial_in_code: dial_in_code ?? null,
    video_link: video_link ?? null,
    status: 'proposed',
    proposed_by: memberId,
    is_platform_wide: false,
    rsvp_count: 0,
  }).select().maybeSingle()

  if (error) {
    console.error('[events/propose] insert error:', error.message)
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
