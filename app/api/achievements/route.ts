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
    if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 })
    let user = null
    try { user = await getCurrentUser() } catch {}
    return NextResponse.json({ achievement: { id: 'ach_' + Date.now(), member_id: member_id ?? 'unknown', type, awarded_by: user ? 'navigator' : 'system', created_at: new Date().toISOString() } }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
