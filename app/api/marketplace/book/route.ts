/**
 * app/api/marketplace/book/route.ts — TC-MKT006
 * Marketplace booking endpoint stub.
 * Returns 401 for unauthenticated requests, 200 stub for authenticated ones.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Stub — booking logic to be implemented
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({
    success: true,
    bookingId: `booking_stub_${Date.now()}`,
    message: 'Booking request received (stub)',
    providerId: body.providerId ?? null,
    serviceId: body.serviceId ?? null,
  })
}
