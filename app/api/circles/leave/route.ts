import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { leaveCircle } from '@/lib/data/circles'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const { circleId } = await request.json()
  if (!circleId) return NextResponse.json({ error: 'circleId required' }, { status: 400 })

  const ok = await leaveCircle(fm.member_id, circleId)
  if (!ok) return NextResponse.json({ error: 'Failed to leave circle' }, { status: 500 })

  return NextResponse.json({ left: true })
}
