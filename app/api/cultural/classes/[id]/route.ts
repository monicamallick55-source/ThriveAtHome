// M25 Phase 106 — Cultural craft & cooking class registration: join (POST) or
// withdraw (DELETE).
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { registerForClass, cancelClassRegistration } from '@/lib/data/cultural'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'Please complete onboarding first.' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const b = (body ?? {}) as Record<string, unknown>

  const { error } = await registerForClass({
    classId: id,
    memberId,
    needsMaterialsKit: b.needs_materials_kit === true,
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

  const { error } = await cancelClassRegistration(id, memberId)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
