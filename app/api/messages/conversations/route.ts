import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family-members'
import { getConversations } from '@/lib/data/messages'

export async function GET() {
  try {
    const user = await requireAuth()
    const { data: fm } = await getFamilyMemberByAuthId(user.id)
    if (!fm?.member_id) return NextResponse.json({ error: 'No member' }, { status: 403 })

    const { data, error } = await getConversations(fm.member_id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ conversations: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
