/**
 * app/api/plan-features/route.ts — Plan Features by Tier
 * TC-PE005
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    basic: {
      navigator_hours_per_month: 2,
      buddy_calls_per_month: 4,
      family_members: 3,
      can_access_marketplace: false,
      can_access_encore_careers: false,
    },
    complete: {
      navigator_hours_per_month: 5,
      buddy_calls_per_month: -1,
      family_members: -1,
      can_access_marketplace: true,
      can_access_encore_careers: true,
    },
  })
}
