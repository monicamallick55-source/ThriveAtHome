import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  return NextResponse.json({
    plan_tier: 'basics',
    features: ['buddy', 'communities', 'events', 'vault'],
    addons: [],
  })
}
