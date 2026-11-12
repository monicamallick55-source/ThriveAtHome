import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ data: [], total: 0 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { member_id, type } = body as { member_id?: string; type?: string }
    if (!member_id || !type) {
      return NextResponse.json({ error: 'member_id and type are required' }, { status: 400 })
    }
    return NextResponse.json(
      { achievement: { id: 'stub-' + Date.now(), member_id, type, created_at: new Date().toISOString() } },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/achievements error:', err)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
