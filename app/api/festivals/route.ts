/**
 * app/api/festivals/route.ts — G7.22 Cultural Festival Calendar
 *
 * GET  /api/festivals              — list upcoming festivals (public + org-specific)
 * POST /api/festivals              — create festival event (admin/navigator)
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('members')
      .select('id, org_id, zip_code')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') // YYYY-MM
    const culture = searchParams.get('culture') // e.g. 'Chinese', 'Indian'
    const myRsvp = searchParams.get('my_rsvp') === 'true'

    if (myRsvp) {
      const { data, error } = await supabase
        .from('festival_rsvps')
        .select('id, status, festival:cultural_festivals(id, name, date, time_start, location, culture, description, image_url)')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ rsvps: data ?? [] })
    }

    // Build date range filter
    const now = new Date()
    let startDate: string
    let endDate: string
    if (month) {
      startDate = `${month}-01`
      const [y, m] = month.split('-').map(Number)
      const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
      endDate = nextMonth
    } else {
      startDate = now.toISOString().slice(0, 10)
      endDate = new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString().slice(0, 10)
    }

    let query = supabase
      .from('cultural_festivals')
      .select('id, name, date, time_start, time_end, location, address, culture, description, image_url, is_free, ticket_price, rsvp_limit, org_id, created_at')
      .gte('date', startDate)
      .lt('date', endDate)
      .order('date', { ascending: true })

    if (culture) query = query.eq('culture', culture)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Get member's RSVPs for these festivals
    const festivalIds = (data ?? []).map(f => f.id)
    let rsvpSet = new Set<string>()
    if (festivalIds.length > 0) {
      const { data: rsvps } = await supabase
        .from('festival_rsvps')
        .select('festival_id')
        .eq('member_id', member.id)
        .in('festival_id', festivalIds)
      rsvpSet = new Set((rsvps ?? []).map(r => r.festival_id))
    }

    const festivals = (data ?? []).map(f => ({ ...f, is_attending: rsvpSet.has(f.id) }))

    // Get available cultures for filter
    const { data: cultures } = await supabase
      .from('cultural_festivals')
      .select('culture')
      .gte('date', startDate)
      .not('culture', 'is', null)

    const uniqueCultures = [...new Set((cultures ?? []).map(c => c.culture).filter(Boolean))].sort()

    return NextResponse.json({ festivals, cultures: uniqueCultures })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, date, time_start, time_end, location, address, culture, description, image_url, is_free, ticket_price, rsvp_limit, org_id } = body

    if (!name || !date) return NextResponse.json({ error: 'name and date are required' }, { status: 400 })

    const { data, error } = await supabase
      .from('cultural_festivals')
      .insert({
        name, date, time_start: time_start ?? null, time_end: time_end ?? null,
        location: location ?? null, address: address ?? null,
        culture: culture ?? null, description: description ?? null,
        image_url: image_url ?? null, is_free: is_free ?? true,
        ticket_price: ticket_price ?? null, rsvp_limit: rsvp_limit ?? null,
        org_id: org_id ?? null, created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ festival: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
