// M25 Phase 103 — Potluck signup: join (POST) or withdraw (DELETE).
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { signUpForPotluck, cancelPotluckSignup } from '@/lib/data/cultural'

export const runtime = 'nodejs'

const DISH_CATEGORIES = new Set(['appetizer', 'main', 'side', 'dessert', 'drink', 'non_food'])

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'Please complete onboarding first.' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const b = (body ?? {}) as Record<string, unknown>
  const dishCategory = typeof b.dish_category === 'string' && DISH_CATEGORIES.has(b.dish_category) ? b.dish_category : 'main'
  const attendeeCount = Number.isInteger(b.attendee_count) ? Math.min(Math.max(Number(b.attendee_count), 1), 10) : 1

  const { error } = await signUpForPotluck({
    potluckId: id,
    memberId,
    dishName: typeof b.dish_name === 'string' ? b.dish_name.slice(0, 160) || null : null,
    dishCategory,
    attendeeCount,
    notes: typeof b.notes === 'string' ? b.notes.slice(0, 500) || null : null,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'Please complete onboarding first.' }, { status: 400 })

  const { error } = await cancelPotluckSignup(id, memberId)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
