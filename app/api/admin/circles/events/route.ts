// app/api/admin/circles/events/route.ts
// POST — admin creates a circle event.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveAdminContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || fm.role !== 'admin') return null
  return fm
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const staff = await resolveAdminContext(supabase)
  if (!staff) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))

  const {
    circle_id, title, description, event_date, event_time, format,
    location_address, video_link, dial_in_code, dial_in_number,
    is_platform_wide, is_recurring,
  } = body as Record<string, string | boolean | undefined>

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }
  if (!event_date || typeof event_date !== 'string') {
    return NextResponse.json({ error: 'event_date is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('circle_events')
    .insert({
      circle_id: circle_id ?? null,
      title: (title as string).trim(),
      description: (description as string | undefined)?.trim() ?? null,
      event_date,
      event_time: (event_time as string | undefined) ?? null,
      format: (format as string | undefined) ?? null,
      location_address: (location_address as string | undefined)?.trim() ?? null,
      video_link: (video_link as string | undefined)?.trim() ?? null,
      dial_in_code: (dial_in_code as string | undefined)?.trim() ?? null,
      dial_in_number: (dial_in_number as string | undefined)?.trim() ?? null,
      is_platform_wide: is_platform_wide ?? false,
      is_recurring: is_recurring ?? false,
      rsvp_count: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
