import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    tiers: [
      { id: 'basic', name: 'Basic', price_monthly: 0, features: ['Community Access', 'Basic Support'] },
      { id: 'standard', name: 'Standard', price_monthly: 29, features: ['Everything in Basic', 'Navigator Hours (2/mo)', 'Buddy Calls'] },
      { id: 'premium', name: 'Premium', price_monthly: 79, features: ['Everything in Standard', 'Unlimited Navigator Hours', 'Priority Support'] },
    ]
  })
}
