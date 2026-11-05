/**
 * app/api/feature-flags/route.ts — Feature Flags (alias)
 * TC-PE003, TC-PE006
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    marketplace_live: false,
    premier_plan_live: false,
    member_campaigns_live: false,
    home_from_hospital_live: true,
    interest_circles_live: true,
    birthday_arc_live: true,
    grief_support_live: true,
  })
}
