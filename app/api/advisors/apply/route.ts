// Advisor listing application — public route, no auth (Phase 98, M24).
import { NextRequest, NextResponse } from 'next/server'
import { submitAdvisorListingApplication } from '@/lib/data/advisors'
import { ADVISOR_TYPES, LISTING_TIERS } from '@/lib/advisors/types'
import type { AdvisorType, AdvisorListingTier } from '@/lib/advisors/types'

export const runtime = 'nodejs'

const VALID_TYPES = ADVISOR_TYPES.map((t: any) => t.value)
const VALID_TIERS = LISTING_TIERS.map((t: any) => t.value)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const {
    full_name, firm_name, advisor_type, email, phone,
    credentials, service_areas, years_experience, requested_tier, message,
  } = body as Record<string, unknown>

  if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
    return NextResponse.json({ error: 'Your name is required.' }, { status: 400 })
  }
  if (!email || typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }
  if (typeof advisor_type !== 'string' || !VALID_TYPES.includes(advisor_type as AdvisorType)) {
    return NextResponse.json({ error: 'Please choose the type of advisor you are.' }, { status: 400 })
  }
  const tier =
    typeof requested_tier === 'string' && VALID_TIERS.includes(requested_tier as AdvisorListingTier)
      ? (requested_tier as AdvisorListingTier)
      : 'standard'

  const { data, error } = await submitAdvisorListingApplication({
    fullName: full_name.trim(),
    firmName: typeof firm_name === 'string' ? firm_name.trim() || null : null,
    advisorType: advisor_type as AdvisorType,
    email: email.trim(),
    phone: typeof phone === 'string' ? phone.trim() || null : null,
    credentials: typeof credentials === 'string' ? credentials.trim() || null : null,
    serviceAreas: typeof service_areas === 'string' ? service_areas.trim() || null : null,
    yearsExperience: typeof years_experience === 'string' ? years_experience.trim() || null : null,
    requestedTier: tier,
    message: typeof message === 'string' ? message.trim() || null : null,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ application: data }, { status: 201 })
}
