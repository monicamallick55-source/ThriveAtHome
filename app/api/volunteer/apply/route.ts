import { NextRequest, NextResponse } from 'next/server'
import { submitVolunteerApplication } from '@/lib/data/volunteers'
import { emailProvider } from '@/lib/providers'

const CARE_TEAM_EMAIL = process.env.CARE_TEAM_EMAIL ?? ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { full_name, email, phone, city, state, languages, availability_days,
            hours_per_week, service_types, interests, why_volunteer, prior_experience } = body

    if (!full_name?.trim() || !email?.trim() || !why_volunteer?.trim()) {
      return NextResponse.json({ error: 'Name, email, and motivation are required.' }, { status: 400 })
    }

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
