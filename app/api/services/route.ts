import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createServiceBooking } from '@/lib/data/services'
import { transportProvider } from '@/lib/providers'

const ALLOWED_SERVICE_TYPES = [
  'transport', 'home_service', 'meals', 'telehealth', 'legal_financial', 'tech_help', 'companion',
] as const
type AllowedServiceType = (typeof ALLOWED_SERVICE_TYPES)[number]

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) {
    return NextResponse.json(
      { error: 'No member linked to this account. Please complete onboarding first.' },
      { status: 400 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const { service_type, booking_details, requested_for, notes } = body as {
    service_type?: string
    booking_details?: Record<string, unknown>
    requested_for?: string
    notes?: string
  }

  if (!service_type || !(ALLOWED_SERVICE_TYPES as readonly string[]).includes(service_type)) {
    return NextResponse.json({ error: 'Invalid service type' }, { status: 400 })
  }
  if (!booking_details || typeof booking_details !== 'object') {
    return NextResponse.json({ error: 'booking_details is required' }, { status: 400 })
  }

  const { data: booking, error } = await createServiceBooking(
    fm.member_id,
    service_type as AllowedServiceType,
    booking_details,
    requested_for ?? null,
    notes ?? null
  )

  if (error) return NextResponse.json({ error }, { status: 500 })

  // Stub provider integration
  if (service_type === 'transport') {
    const { pickup_address, destination, date_time } = booking_details as Record<string, string>
    console.log(`[STUB][Transport] Would book ride for member ${fm.member_id}: ${pickup_address ?? '?'} → ${destination ?? '?'} at ${date_time ?? '?'}`)
    void transportProvider
  }

  return NextResponse.json({ booking }, { status: 201 })
}
