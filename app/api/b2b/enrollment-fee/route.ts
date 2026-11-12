import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ fee: 3300, currency: 'usd', description: 'B2B Enrollment Fee', price_id: process.env.STRIPE_B2B_ENROLLMENT_PRICE_ID ?? '' })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
