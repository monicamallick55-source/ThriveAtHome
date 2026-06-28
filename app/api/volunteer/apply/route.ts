import { NextRequest, NextResponse } from 'next/server'
import { submitVolunteerApplication } from '@/lib/data/volunteers'
import { emailProvider } from '@/lib/providers'

const CARE_TEAM_EMAIL = process.env.CARE_TEAM_EMAIL ?? ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { full_name, email, phone, city, state, zip_code, preferred_contact, languages, availability_days,
            hours_per_week, service_types, interests, why_volunteer, prior_experience,
            has_drivers_license, license_state, insurance_provider, insurance_expiry,
            background_check_consent, corporate_program_id,
            // M21 fields
            volunteer_specialty, professional_background, faith_affiliation,
            is_chaplain, is_neighbor_volunteer, is_family_reciprocal } = body

    if (!full_name?.trim() || !email?.trim() || !why_volunteer?.trim()) {
      return NextResponse.json({ error: 'Name, email, and motivation are required.' }, { status: 400 })
    }
    if (!background_check_consent) {
      return NextResponse.json({ error: 'Background check consent is required.' }, { status: 400 })
    }

    const notes = [
      preferred_contact ? `Preferred contact: ${preferred_contact}` : null,
      background_check_consent ? 'Background check consented' : null,
    ].filter(Boolean).join(' | ')

    const { data, error } = await submitVolunteerApplication({
      full_name: full_name.trim(),
      email: email.trim(),
      phone: phone?.trim() || undefined,
      city: city?.trim() || undefined,
      state: state?.trim() || undefined,
      languages: Array.isArray(languages) ? languages : [],
      availability_days: Array.isArray(availability_days) ? availability_days : [],
      hours_per_week: hours_per_week || undefined,
      service_types: Array.isArray(service_types) ? service_types : [],
      interests: Array.isArray(interests) ? interests : [],
      why_volunteer: why_volunteer.trim(),
      prior_experience: prior_experience?.trim() || undefined,
      notes: notes || undefined,
      has_drivers_license: !!has_drivers_license,
      license_state: license_state?.trim() || undefined,
      insurance_provider: insurance_provider?.trim() || undefined,
      insurance_expiry: insurance_expiry || undefined,
      corporate_program_id: corporate_program_id || undefined,
      // M21 tracks
      zip_code: zip_code?.trim() || undefined,
      volunteer_specialty: volunteer_specialty || undefined,
      professional_background: professional_background?.trim() || undefined,
      faith_affiliation: faith_affiliation || undefined,
      is_chaplain: !!is_chaplain || undefined,
      is_neighbor_volunteer: !!is_neighbor_volunteer || undefined,
      is_family_reciprocal: !!is_family_reciprocal || undefined,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    // Notify care team — best-effort, non-blocking
    if (CARE_TEAM_EMAIL) {
      void emailProvider.sendVolunteerApplicationNotification(
        CARE_TEAM_EMAIL,
        full_name.trim(),
        email.trim(),
        city?.trim() || '',
        Array.isArray(service_types) ? service_types : []
      ).catch(err => console.error('[api/volunteer/apply] Email notification failed:', err))
    }

    return NextResponse.json({ id: data?.id }, { status: 201 })
  } catch (e) {
    console.error('[api/volunteer/apply] Unexpected error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
