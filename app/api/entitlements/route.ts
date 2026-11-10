import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    plan_tier: 'basic',
    navigator_hours_per_month: 1,
    navigator_hours_used: 0,
    buddy_calls_per_month: 2,
    buddy_calls_used: 0,
    premium_content: false,
    fraud_monitoring: false,
  })
}
