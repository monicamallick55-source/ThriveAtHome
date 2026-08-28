// M27 Phase 117 — edit or delete a pet profile.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { updatePet, deletePet } from '@/lib/data/pets'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const b = body as Record<string, unknown>
  const { data, error } = await updatePet(id, fm.member_id, {
    name: typeof b.name === 'string' ? b.name : undefined,
    species: typeof b.species === 'string' ? b.species : undefined,
    breed: typeof b.breed === 'string' ? b.breed : undefined,
    birthDate: b.birth_date === null || typeof b.birth_date === 'string' ? (b.birth_date as string | null) : undefined,
    adoptionDate:
      b.adoption_date === null || typeof b.adoption_date === 'string' ? (b.adoption_date as string | null) : undefined,
    colorMarkings: typeof b.color_markings === 'string' ? b.color_markings : undefined,
    notes: typeof b.notes === 'string' ? b.notes : undefined,
  })
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ pet: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 400 })

  const { error } = await deletePet(id, fm.member_id)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
