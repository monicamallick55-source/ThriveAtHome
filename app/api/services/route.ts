import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createServiceBooking } from '@/lib/data/services'
import { createAdminClient } from '@/lib/supabase/admin'
import { transportProvider } from '@/lib/providers'

const ALLOWED_SERVICE_TYPES = [
  'transport', 'home_service', 'meals', 'telehealth', 'legal_financial', 'tech_help', 'companionship', 'companion', 'travel_assistance', 'roadside',
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
    } else if (service_type === 'travel_assistance') {
      const travelDesc = subtype === 'travel_companion'
        ? `Member needs a travel companion. Match with volunteers or paid companions willing to travel — subtype: ${subtype}.`
        : `Member requested travel assistance — subtype: ${subtype || 'general'}. Connect with vetted travel agent or help family book directly.`
      await admin.from('navigator_tasks').insert({
        member_id: fm.member_id,
        task_type: 'travel_assistance',
        description: travelDesc,
        priority: subtype === 'travel_companion' ? 'medium' : 'low',
      })
    } else if (service_type === 'roadside') {
      const isEmergency = subtype === 'other_roadside'
      const roadsideDetails = booking_details as Record<string, string>
      const prefillNote = roadsideDetails.aaa_membership_info
        ? ` AAA on file: ${roadsideDetails.aaa_membership_info}.`
        : roadsideDetails.insurance_roadside_info
          ? ` Car insurance roadside coverage: ${roadsideDetails.insurance_roadside_info}.`
          : ''
      await admin.from('navigator_tasks').insert({
        member_id: fm.member_id,
        task_type: 'roadside_assistance',
        description: `Member needs roadside help — ${subtype?.replace(/_/g, ' ') || 'type unspecified'}.${prefillNote} Coordinate using member's AAA or insurance coverage.`,
        priority: isEmergency ? 'critical' : 'high',
      })
      if (isEmergency) {
        console.log(`[STUB][Roadside][URGENT] Emergency roadside request for member ${fm.member_id} — navigator notified immediately`)
      } else {
        console.log(`[STUB][Roadside] Roadside assistance request for member ${fm.member_id} — subtype: ${subtype}`)
      }
    }
  }

  return NextResponse.json({ booking }, { status: 201 })
}
