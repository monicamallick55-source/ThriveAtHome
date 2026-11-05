/**
 * app/api/festivals/[id]/rsvp/route.ts
 * POST /api/festivals/[id]/rsvp  — RSVP or cancel RSVP
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase.from('members').select('id').eq('supabase_auth_id', user.id).single()
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    // Check festival exists
    const { data: festival } = await supabase.from('cultural_festivals').select('id, rsvp_limit').eq('id', id).single()
    if (!festival) return NextResponse.json({ error: 'Festival not found' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const { action } = body // 'rsvp' or 'cancel'

    if (action === 'cancel') {
      await supabase.from('festival_rsvps').delete().eq('festival_id', id).eq('member_id', member.id)
      return NextResponse.json({ status: 'cancelled' })
    }

    // Check capacity
    if (festival.rsvp_limit) {
      const { count } = await supabase.from('festival_rsvps').select('*', { count: 'exact', head: true }).eq('festival_id', id).eq('status', 'going')
      if (count && count >= festival.rsvp_limit) return NextResponse.json({ error: 'Event is at capacity' }, { status: 409 })
    }

    // Upsert RSVP
    const { data, error } = await supabase.from('festival_rsvps').upsert({
      festival_id: id,
      member_id: member.id,
      status: 'going',
      created_at: new Date().toISOString(),
    }, { onConflict: 'festival_id,member_id' }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ rsvp: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
