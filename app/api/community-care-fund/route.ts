import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ balance: 0, allocations: [], currency: 'usd' })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const { member_id, amount, reason } = body as { member_id?: string; amount?: number; reason?: string }
    if (!member_id || !amount || !reason) {
      return NextResponse.json({ error: 'member_id, amount, and reason are required' }, { status: 400 })
    }
    return NextResponse.json({ id: 'ccf_'+Date.now(), member_id, amount, reason, status: 'pending', created_at: new Date().toISOString() }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
