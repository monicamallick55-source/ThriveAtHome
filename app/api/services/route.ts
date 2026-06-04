import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createServiceBooking } from '@/lib/data/services'
import { createAdminClient } from '@/lib/supabase/admin'
import { transportProvider } from '@/lib/providers'

const ALLOWED_SERVICE_TYPES = [
  'transport', 'home_service', 'meals', 'telehealth', 'legal_financial', 'tech_help', 'companionship', 'companion',
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

  // Date validation: required, valid format, must be future
  if (!requested_for) {
    return NextResponse.json({ error: 'A date and time is required for this request.' }, { status: 400 })
  }
  const requestedDate = new Date(requested_for)
  if (isNaN(requestedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date format. Please select a valid date and time.' }, { status: 400 })
  }
  if (requestedDate <= new Date()) {
    return NextResponse.json({ error: 'Please select a future date and time.' }, { status: 400 })
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

  if (service_type === 'companion') {
    const { companion_id, companion_name } = booking_details as Record<string, string>
    console.log(`[STUB][Billing] Would process companion payout for companion ${companion_id ?? '?'} (${companion_name ?? '?'}) — session for member ${fm.member_id}. Stripe Connect required.`)
  }

  // Auto-create navigator tasks for high-priority service types
  if (booking) {
    const admin = createAdminClient()
    const subtype = (booking_details as Record<string, string>).subtype ?? ''

    if (service_type === 'tech_help') {
      await admin.from('navigator_tasks').insert({
        member_id: fm.member_id,
        task_type: 'tech_help_request',
        description: `New tech help request — subtype: ${subtype || 'unspecified'}. Coordinate volunteer or in-home visit.`,
        priority: 'medium',
      })
    } else if (service_type === 'telehealth' && subtype === 'mental_health_companion') {
      await admin.from('navigator_tasks').insert({
        member_id: fm.member_id,
        task_type: 'mental_health_referral',
        description: 'Member requested mental health support. Review and provide a warm referral to appropriate professional.',
        priority: 'high',
      })
    }
  }

  return NextResponse.json({ booking }, { status: 201 })
}
