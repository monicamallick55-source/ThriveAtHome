// M27 Phase 117 — list a member's pets and add a new pet profile.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getPetsForMember, createPet } from '@/lib/data/pets'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ pets: [] })
  const { data, error } = await getPetsForMember(fm.member_id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ pets: data })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) {
    return NextResponse.json({ error: 'Please complete onboarding first.' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const b = body as Record<string, unknown>
  if (typeof b.name !== 'string' || !b.name.trim()) {
    return NextResponse.json({ error: 'Please give your companion a name.' }, { status: 400 })
  }

  const { data, error } = await createPet(fm.member_id, fm.id, {
    name: b.name,
    species: typeof b.species === 'string' ? b.species : undefined,
    breed: typeof b.breed === 'string' ? b.breed : null,
    birthDate: typeof b.birth_date === 'string' ? b.birth_date : null,
    adoptionDate: typeof b.adoption_date === 'string' ? b.adoption_date : null,
    colorMarkings: typeof b.color_markings === 'string' ? b.color_markings : null,
    notes: typeof b.notes === 'string' ? b.notes : null,
  })
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ pet: data }, { status: 201 })
}
