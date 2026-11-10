import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

const DEFAULT_PROFILE = {
  smoke_detectors: false, carbon_monoxide_detector: false, grab_bars: false,
  non_slip_mats: false, good_lighting: false, stair_handrails: false,
  emergency_contacts: [], checklist_completed_at: null,
  earthquake_kit: false, water_supply_days: 0, emergency_plan: false,
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ profile: DEFAULT_PROFILE, checklist: [] })
}

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ profile: DEFAULT_PROFILE })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true })
}
