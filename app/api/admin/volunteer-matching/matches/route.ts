import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getTopVolunteerMatches } from '@/lib/data/volunteers'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const role = await getUserRole(user.id)
    if (role !== 'admin' && role !== 'navigator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const memberId = req.nextUrl.searchParams.get('memberId')
    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
    }

    const { data, error } = await getTopVolunteerMatches(memberId, 3)
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ matches: data ?? [] })
  } catch (e) {
    console.error('[admin/volunteer-matching/matches] Unexpected error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
