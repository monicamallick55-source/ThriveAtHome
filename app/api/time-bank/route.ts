// app/api/time-bank/route.ts
// GET — list time-bank credits for the current member (as beneficiary) or family member (as earner)
// POST — staff records a new time-bank credit after a family volunteer session

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const { data: isStaff } = await supabase.rpc('is_staff')

  return { user, fm, isStaff: !!isStaff, supabase }
}

export async function GET(req: Request) {
  const ctx = await resolveContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  let query = admin
    .from('time_bank_credits')
    .select(`
      id, created_at, credits, hours_served, service_type, performed_for_member_id,
      redeemed_at, note,
      earner:family_members(id, member:members(full_name, preferred_name)),
      beneficiary:members!time_bank_credits_beneficiary_member_id_fkey(id, full_name, preferred_name),
      performed_for:members!time_bank_credits_performed_for_member_id_fkey(id, full_name, preferred_name)
    `)
    .order('created_at', { ascending: false })

  if (ctx.isStaff && memberId) {
    query = query.eq('beneficiary_member_id', memberId)
  } else if (ctx.fm) {
    // Show credits where this family member is the earner OR beneficiary
    query = query.or(`earner_family_member_id.eq.${ctx.fm.id},beneficiary_member_id.eq.${ctx.fm.member_id}`)
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: credits, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sum unredeemed credits
  const balance = (credits ?? [])
    .filter((c: Record<string, unknown>) => !c.redeemed_at)
    .reduce((sum: number, c: Record<string, unknown>) => sum + Number(c.credits), 0)

  return NextResponse.json({ credits: credits ?? [], balance })
}

export async function POST(req: Request) {
  const ctx = await resolveContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  if (!ctx.isStaff) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const {
    earner_family_member_id,
    performed_for_member_id,
    hours_served,
    service_type,
    note,
    service_booking_id,
  } = body as {
    earner_family_member_id?: string
    performed_for_member_id?: string
    hours_served?: number
    service_type?: string
    note?: string
    service_booking_id?: string
  }

  if (!earner_family_member_id || !performed_for_member_id || !hours_served || !service_type) {
    return NextResponse.json({ error: 'earner_family_member_id, performed_for_member_id, hours_served, service_type required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Look up earner's own senior (beneficiary)
  const { data: earnerFm } = await admin
    .from('family_members')
    .select('id, member_id')
    .eq('id', earner_family_member_id)
    .maybeSingle()

  if (!earnerFm) return NextResponse.json({ error: 'Earner family member not found' }, { status: 404 })

  // Guard: cannot volunteer for own senior
  if (earnerFm.member_id === performed_for_member_id) {
    return NextResponse.json({ error: 'Family volunteers cannot be matched to their own senior' }, { status: 422 })
  }

  const credits = hours_served // 1 credit per hour

  const { data: credit, error } = await admin
    .from('time_bank_credits')
    .insert({
      earner_family_member_id,
      beneficiary_member_id: earnerFm.member_id,
      performed_for_member_id,
      hours_served,
      credits,
      service_type,
      note: note ?? null,
      service_booking_id: service_booking_id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify beneficiary member
  await admin.from('realtime_notifications').insert({
    member_id: earnerFm.member_id,
    type: 'system_message',
    title: `${credits} time-bank credit${credits !== 1 ? 's' : ''} added to your account`,
    body: `A family member volunteered ${hours_served}h for ${service_type} and earned credits for you.`,
    severity: 'info',
  })

  return NextResponse.json({ credit }, { status: 201 })
}
