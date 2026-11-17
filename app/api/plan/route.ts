import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  return NextResponse.json({
    plan_tier: 'basic',
    plan_name: 'Basic',
    price_monthly: 0,
    renewal_date: null,
    features: ['Community Access', 'Basic Support'],
  })
}
