// M26 — cancel a member add-on (monthly subscription or an unfulfilled one-time order).
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { cancelAddon } from '@/lib/data/premium-addons'

export const runtime = 'nodejs'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) {
    return NextResponse.json({ error: 'Please complete onboarding first.' }, { status: 400 })
  }

  const { error } = await cancelAddon(memberId, id)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
