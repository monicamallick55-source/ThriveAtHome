import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getThread } from '@/lib/data/member-messages'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { data: fm } = await getFamilyMemberByAuthId(user.id)
    if (!fm?.member_id) return NextResponse.json({ error: 'No member' }, { status: 403 })

    const key = req.nextUrl.searchParams.get('key')
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

    const { data, error } = await getThread(key, fm.member_id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ messages: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
