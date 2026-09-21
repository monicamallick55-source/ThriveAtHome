import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { leaveCircle } from '@/lib/data/circles'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const { circleId } = await request.json()
  if (!circleId) return NextResponse.json({ error: 'circleId required' }, { status: 400 })

  const ok = await leaveCircle(memberId, circleId)
  if (!ok) return NextResponse.json({ error: 'Failed to leave circle' }, { status: 500 })

  return NextResponse.json({ left: true })
}
