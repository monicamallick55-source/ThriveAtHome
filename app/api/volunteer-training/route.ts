import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

const STUB_MODULES = [
  { id: 'm1', title: 'Volunteer Orientation', duration_minutes: 30, required: true, completed: false },
  { id: 'm2', title: 'Elder Care Basics', duration_minutes: 45, required: true, completed: false },
  { id: 'm3', title: 'Communication Skills', duration_minutes: 20, required: false, completed: false },
]

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ modules: STUB_MODULES, completion_pct: 0 })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true })
}
