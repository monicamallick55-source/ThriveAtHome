import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({ id: 'part-' + Date.now(), ...body, status: 'registered' }, { status: 201 })
}
