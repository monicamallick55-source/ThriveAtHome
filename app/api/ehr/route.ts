// M22 Phase 92 — list and connect a member's EHR (HL7 FHIR) integrations.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { ehrProvider } from '@/lib/providers'
import { getEhrConnectionsForMember, upsertEhrConnection } from '@/lib/data/devices'

export const runtime = 'nodejs'

const SYSTEMS = ['epic', 'cerner', 'athenahealth', 'generic_fhir'] as const
const DEFAULT_SCOPES = ['patient/Observation.write', 'patient/Condition.write']

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'Complete onboarding first.' }, { status: 400 })

  const { data, error } = await getEhrConnectionsForMember(memberId)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ connections: data })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'Complete onboarding first.' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const ehrSystem = body?.ehr_system
  const fhirBaseUrl = typeof body?.fhir_base_url === 'string' ? body.fhir_base_url : null
  if (typeof ehrSystem !== 'string' || !(SYSTEMS as readonly string[]).includes(ehrSystem)) {
    return NextResponse.json({ error: 'Invalid EHR system' }, { status: 400 })
  }
  if (ehrSystem === 'generic_fhir' && !fhirBaseUrl) {
    return NextResponse.json({ error: 'A FHIR base URL is required for a generic FHIR endpoint.' }, { status: 400 })
  }

  let connectResult
  try {
    connectResult = await ehrProvider.connect({
      memberId,
      ehrSystem,
      fhirBaseUrl: fhirBaseUrl ?? undefined,
    })
  } catch (e) {
    console.error('[api/ehr] connect failed:', e)
    return NextResponse.json({ error: 'Could not connect to the health record system. Please try again.' }, { status: 502 })
  }

  const { data, error } = await upsertEhrConnection({
    memberId,
    ehrSystem,
    fhirBaseUrl,
    patientFhirId: connectResult.patientFhirId,
    scopes: DEFAULT_SCOPES,
    status: connectResult.status === 'active' ? 'active' : 'pending',
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ connection: data, authUrl: connectResult.authUrl ?? null }, { status: 201 })
}
