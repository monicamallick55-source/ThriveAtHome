import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    plan_tier: 'basic',
    plan_name: 'Basic',
    price_monthly: 0,
    renewal_date: null,
    features: ['Community Access', 'Basic Support'],
  })
}
