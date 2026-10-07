// VITA / TCE — request help arranging free tax preparation (Phase 99, M24).
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { createAdminClient } from '@/lib/supabase/admin'
import { createVitaAppointmentRequest } from '@/lib/data/vita'
import { INCOME_BANDS, FILING_SITUATIONS } from '@/lib/vita/eligibility'

export const runtime = 'nodejs'

const VALID_BANDS = INCOME_BANDS.map((b: any) => b.value)
const VALID_SITUATIONS = FILING_SITUATIONS.map((s: any) => s.value)

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId, familyMemberId } = await resolveMemberContext(user.id)
  if (!memberId) {
    return NextResponse.json({ error: 'Please complete onboarding first.' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const {
    vita_site_id, tax_year, filing_situation, estimated_income_band,
    needs_transport, needs_language_support, preferred_dates,
  } = body as Record<string, unknown>

  const year = Number(tax_year)
  const nowYear = new Date().getFullYear()
  if (!Number.isInteger(year) || year < nowYear - 6 || year > nowYear) {
    return NextResponse.json({ error: 'Please choose a valid tax year.' }, { status: 400 })
  }
  if (filing_situation && !VALID_SITUATIONS.includes(String(filing_situation))) {
    return NextResponse.json({ error: 'Invalid filing situation.' }, { status: 400 })
  }
  if (estimated_income_band && !VALID_BANDS.includes(String(estimated_income_band))) {
    return NextResponse.json({ error: 'Invalid income band.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select('preferred_name')
    .eq('id', memberId)
    .maybeSingle()

  const { data, error } = await createVitaAppointmentRequest({
    memberId,
    requestedBy: familyMemberId,
    vitaSiteId: typeof vita_site_id === 'string' && vita_site_id ? vita_site_id : null,
    taxYear: year,
    filingSituation: filing_situation ? String(filing_situation) : null,
    estimatedIncomeBand: estimated_income_band ? String(estimated_income_band) : null,
    needsTransport: needs_transport === true,
    needsLanguageSupport:
      typeof needs_language_support === 'string' ? needs_language_support.trim().slice(0, 120) || null : null,
    preferredDates: typeof preferred_dates === 'string' ? preferred_dates.trim().slice(0, 300) || null : null,
    memberPreferredName: member?.preferred_name ?? 'The member',
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ appointment: data }, { status: 201 })
}
