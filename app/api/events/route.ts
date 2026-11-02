// app/api/events/route.ts — G5.3 near_you badge
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const metroOnly = searchParams.get('metro_only') === 'true'
  const upcomingOnly = searchParams.get('upcoming') !== 'false'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  let memberMetroId: string | null = null
  if (user) {
    const { data: member } = await db.from('members').select('metro_area_id').eq('supabase_auth_id', user.id).maybeSingle()
    if (!member) {
      const { data: fm } = await db.from('family_members').select('member_id').eq('supabase_auth_id', user.id).maybeSingle()
      if (fm?.member_id) {
        const { data: lm } = await db.from('members').select('metro_area_id').eq('id', fm.member_id).maybeSingle()
        memberMetroId = lm?.metro_area_id ?? null
      }
    } else {
      memberMetroId = member?.metro_area_id ?? null
    }
  }
  let query = db.from('events')
    .select('id, title, description, start_time, end_time, location, location_type, image_url, max_capacity, rsvp_count, metro_area_id, is_published, tags')
    .eq('is_published', true).order('start_time', { ascending: true }).range(offset, offset + limit - 1)
  if (upcomingOnly) query = query.gte('start_time', new Date().toISOString())
  if (metroOnly && memberMetroId) query = query.eq('metro_area_id', memberMetroId)
  const { data: events, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const enriched = (events ?? []).map((ev: { id: string; metro_area_id: string | null; [key: string]: unknown }) => ({
    ...ev, near_you: memberMetroId !== null && ev.metro_area_id === memberMetroId,
  }))
  return NextResponse.json({ events: enriched, member_metro_id: memberMetroId, total: enriched.length, offset, limit })
}
