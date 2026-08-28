// M25 Phase 103 — Community potlucks: list upcoming + host a new one.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getUpcomingPotlucks, createPotluck } from '@/lib/data/cultural'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  const potlucks = await getUpcomingPotlucks(fm?.member_id ?? undefined)
  return NextResponse.json({ potlucks })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'Please complete onboarding first.' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  const b = body as Record<string, unknown>

  const title = typeof b.title === 'string' ? b.title.trim() : ''
  const potluckDate = typeof b.potluck_date === 'string' ? b.potluck_date : ''
  const locationAddress = typeof b.location_address === 'string' ? b.location_address.trim() : ''
  if (!title) return NextResponse.json({ error: 'Please give the potluck a title.' }, { status: 400 })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(potluckDate)) return NextResponse.json({ error: 'Please choose a valid date.' }, { status: 400 })
  if (!locationAddress) return NextResponse.json({ error: 'Please add a location address.' }, { status: 400 })

  const { data, error } = await createPotluck({
    hostMemberId: fm.member_id,
    title: title.slice(0, 160),
    circleId: typeof b.circle_id === 'string' && b.circle_id ? b.circle_id : null,
    festivalTag: typeof b.festival_tag === 'string' ? b.festival_tag.slice(0, 80) || null : null,
    potluckDate,
    potluckTime: typeof b.potluck_time === 'string' && b.potluck_time ? b.potluck_time : null,
    locationName: typeof b.location_name === 'string' ? b.location_name.slice(0, 120) || null : null,
    locationAddress: locationAddress.slice(0, 300),
    city: typeof b.city === 'string' ? b.city.slice(0, 80) || null : null,
    state: typeof b.state === 'string' ? b.state.slice(0, 40) || null : null,
    capacity: Number.isInteger(b.capacity) ? Math.min(Math.max(Number(b.capacity), 2), 200) : 20,
    description: typeof b.description === 'string' ? b.description.slice(0, 1000) || null : null,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ potluck: data }, { status: 201 })
}
