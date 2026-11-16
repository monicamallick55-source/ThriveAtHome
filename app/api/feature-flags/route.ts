import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
const DEFAULT_FLAGS: Record<string, boolean> = {
  marketplace_live: false, premier_plan_live: false, member_campaigns_live: false,
  home_from_hospital_live: true, interest_circles_live: true, birthday_arc_live: true,
  grief_support_live: true, memory_book: true, encore_careers: true,
}
const overrides: Record<string, boolean> = {}
export async function GET() {
  return NextResponse.json({ ...DEFAULT_FLAGS, ...overrides })
}
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { flag_name, enabled } = body
  if (!flag_name) return NextResponse.json({ error: 'flag_name required' }, { status: 400 })
  overrides[flag_name] = !!enabled
  return NextResponse.json({ id: `flag-${flag_name}`, flag_name, enabled: !!enabled, updated: true })
}
