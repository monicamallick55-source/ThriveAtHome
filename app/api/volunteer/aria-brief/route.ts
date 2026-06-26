// GET /api/volunteer/aria-brief?member_id=... — returns Aria pre-call brief for a member
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { generateAriaBrief } from '@/lib/data/buddies'

export async function GET(req: Request) {
  try {
    await requireAuth()
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('member_id')
    if (!memberId) return NextResponse.json({ error: 'member_id required' }, { status: 400 })

    const { brief, error } = await generateAriaBrief(memberId)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ brief })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
