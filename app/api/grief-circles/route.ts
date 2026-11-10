import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

const STUB_CIRCLES = [
  { id: '1', name: 'Loss of Spouse', facilitator: 'Dr. Sarah Chen', schedule: 'Tuesdays 2pm', members: 8, max_members: 12 },
  { id: '2', name: 'Caregiver Support', facilitator: 'Rev. James Park', schedule: 'Thursdays 10am', members: 6, max_members: 10 },
  { id: '3', name: 'Healing Through Loss', facilitator: 'Dr. Maria Lopez', schedule: 'Wednesdays 3pm', members: 9, max_members: 12 },
]

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ circles: [] })
  return NextResponse.json({ circles: STUB_CIRCLES })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ error: 'Staff only' }, { status: 403 })
}
