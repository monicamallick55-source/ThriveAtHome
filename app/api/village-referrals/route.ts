/**
 * app/api/village-referrals/route.ts — 16.1 Village-to-Village Referral Workflow
 *
 * GET  /api/village-referrals?direction=outgoing|incoming — list referrals
 * POST /api/village-referrals — create a new referral
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: self } = await supabase
      .from('org_admins')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!self) return NextResponse.json({ error: 'Not an org admin' }, { status: 403 })

    const direction = new URL(req.url).searchParams.get('direction') ?? 'outgoing'
    const field = direction === 'incoming' ? 'receiving_village_id' : 'referring_village_id'

    const { data, error } = await supabase
      .from('village_referrals')
      .select(`
        id, created_at, status, reason, notes, transfer_date, responded_at,
        referring_village_id, receiving_village_id,
        member:members(first_name, last_name, date_of_birth),
        referring_village:organizations!referring_village_id(name),
        receiving_village:organizations!receiving_village_id(name)
      `)
      .eq(field, self.org_id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ referrals: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: self } = await supabase
      .from('org_admins')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    if (!self) return NextResponse.json({ error: 'Not an org admin' }, { status: 403 })
    if (self.role === 'viewer') return NextResponse.json({ error: 'Viewers cannot create referrals' }, { status: 403 })

    const body = await req.json()
    const { member_id, receiving_village_id, reason, notes } = body

    if (!member_id || !receiving_village_id || !reason) {
      return NextResponse.json({ error: 'member_id, receiving_village_id, and reason are required' }, { status: 400 })
    }

    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('id', member_id)
      .eq('org_id', self.org_id)
      .single()

    if (!member) return NextResponse.json({ error: 'Member not found in your organization' }, { status: 404 })

    const { data: partner } = await supabase
      .from('village_partnerships')
      .select('id')
      .or(`village_a_id.eq.${self.org_id},village_b_id.eq.${self.org_id}`)
      .or(`village_a_id.eq.${receiving_village_id},village_b_id.eq.${receiving_village_id}`)
      .eq('status', 'active')
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Receiving village is not a registered partner.' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('village_referrals')
      .select('id')
      .eq('member_id', member_id)
      .in('status', ['pending', 'accepted'])
      .single()

    if (existing) {
      return NextResponse.json({ error: 'An active referral already exists for this member' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('village_referrals')
      .insert({
        referring_village_id: self.org_id,
        receiving_village_id,
        member_id,
        reason,
        notes: notes ?? null,
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ referral: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
