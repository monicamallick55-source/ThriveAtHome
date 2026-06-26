import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCenterAdmin, createActivity } from '@/lib/data/seniorCenters'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { center_id, title, activity_type, room, instructor_name, scheduled_at, duration_minutes, max_capacity, description } = body

    if (!center_id || !title?.trim() || !scheduled_at) {
      return NextResponse.json({ error: 'center_id, title, and scheduled_at are required' }, { status: 400 })
    }

    const isAdmin = await verifyCenterAdmin(user.id, center_id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await createActivity({
      center_id,
      title: title.trim(),
      activity_type: activity_type ?? 'class',
      room: room ?? null,
      instructor_name: instructor_name ?? null,
      scheduled_at,
      duration_minutes: duration_minutes ?? 60,
      max_capacity: max_capacity ?? null,
      description: description ?? null,
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// PATCH — register an attendee for an activity
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { activity_id, center_id, visitor_name } = body

    if (!activity_id || !center_id || !visitor_name?.trim()) {
      return NextResponse.json({ error: 'activity_id, center_id, and visitor_name are required' }, { status: 400 })
    }

    const isAdmin = await verifyCenterAdmin(user.id, center_id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const admin = createAdminClient()
    // Insert registration (ignore duplicate if already registered)
    const { data: regData, error: regError } = await (admin.from as any)('activity_registrations')
      .insert({ activity_id, center_id, visitor_name: visitor_name.trim() })
      .select()
      .maybeSingle()
    if (regError && !regError.message.includes('duplicate')) {
      return NextResponse.json({ error: regError.message }, { status: 500 })
    }

    // Increment registration_count
    const { data: act } = await (admin.from as any)('center_activities').select('registration_count').eq('id', activity_id).maybeSingle()
    await (admin.from as any)('center_activities')
      .update({ registration_count: ((act as { registration_count: number } | null)?.registration_count ?? 0) + 1 })
      .eq('id', activity_id)

    return NextResponse.json({ data: regData })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
