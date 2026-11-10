import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

const STUB_ADVISORS = [
  { id: '1', name: 'Sarah Mitchell, Esq.', specialty: 'elder_law_attorney', bio: 'Elder law specialist with 20 years experience.', telehealth: true, non_proselytizing: true },
  { id: '2', name: 'Robert Chen, CFP', specialty: 'financial_planner', bio: 'Certified financial planner focused on retirement.', telehealth: true, non_proselytizing: true },
  { id: '3', name: 'Dr. Angela Torres', specialty: 'geriatric_care_manager', bio: 'Geriatric care manager specializing in aging in place.', telehealth: false, non_proselytizing: true },
  { id: '4', name: 'Rev. James Park', specialty: 'chaplain', bio: 'Non-denominational chaplain and grief counselor.', telehealth: true, non_proselytizing: true },
  { id: '5', name: 'Dr. Lisa Nguyen', specialty: 'licensed_therapist', bio: 'Licensed therapist specializing in life transitions.', telehealth: true, non_proselytizing: true },
]

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ advisors: [] })
  const { searchParams } = new URL(req.url)
  const specialty = searchParams.get('specialty')
  const advisors = specialty ? STUB_ADVISORS.filter(a => a.specialty === specialty) : STUB_ADVISORS
  return NextResponse.json({ advisors })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true })
}
