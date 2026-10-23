import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { sendMessage } from '@/lib/data/member-messages'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { data: fm } = await getFamilyMemberByAuthId(user.id)
    if (!fm?.member_id) return NextResponse.json({ error: 'No member' }, { status: 403 })

    const { recipientId, body } = await req.json() as { recipientId: string; body: string }
    if (!recipientId || !body?.trim()) {
      return NextResponse.json({ error: 'recipientId and body required' }, { status: 400 })
    }
    if (recipientId === fm.member_id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
    }
    if (body.trim().length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 })
    }

    const { data, error } = await sendMessage(fm.member_id, recipientId, body)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ message: data })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
