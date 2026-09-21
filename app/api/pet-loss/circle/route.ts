// M27 Phase 119 — join or leave The Companion Circle (pet loss peer circle).
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { getMemberById } from '@/lib/data/members'
import { joinPetLossCircle, leavePetLossCircle } from '@/lib/data/pet-loss'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  let displayName = typeof b.display_name === 'string' && b.display_name.trim() ? b.display_name : null
  if (!displayName) {
    const { data: member } = await getMemberById(memberId)
    displayName = member?.preferred_name ?? 'A circle member'
  }
  const petRemembered = typeof b.pet_remembered === 'string' ? b.pet_remembered : null

  const { data, error } = await joinPetLossCircle(memberId, displayName, petRemembered)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ membership: data }, { status: 201 })
}

export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 400 })

  const { error } = await leavePetLossCircle(memberId)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
