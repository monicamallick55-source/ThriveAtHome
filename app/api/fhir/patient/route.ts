/**
 * FHIR R4 Patient intake endpoint.
 * POST /api/fhir/patient — accepts a FHIR Patient resource, upserts into members.
 * GET  /api/fhir/patient?memberId=xxx — returns member as FHIR Patient resource.
 * Requires FHIR_API_KEY header for authentication.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function requireFhirAuth(req: NextRequest): boolean {
  const key = req.headers.get('x-fhir-api-key') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  return key === process.env.FHIR_API_KEY
}

function memberToFhirPatient(member: Record<string, unknown>) {
  return {
    resourceType: 'Patient',
    id: member.id,
    name: [{ use: 'official', text: member.full_name, given: [member.preferred_name ?? member.full_name] }],
    telecom: member.phone ? [{ system: 'phone', value: member.phone, use: 'home' }] : [],
    birthDate: member.date_of_birth ?? undefined,
    address: member.zip_code ? [{ postalCode: member.zip_code }] : [],
    extension: [
      { url: 'https://thriveatHome.com/fhir/member-id', valueString: member.id },
      { url: 'https://thriveatHome.com/fhir/plan', valueString: member.plan ?? 'free' },
    ],
  }
}

export async function GET(req: NextRequest) {
  if (!requireFhirAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase.from('members').select('*').eq('id', memberId).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json(memberToFhirPatient(data as Record<string, unknown>), {
    headers: { 'Content-Type': 'application/fhir+json' }
  })
}

export async function POST(req: NextRequest) {
  if (!requireFhirAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (body.resourceType !== 'Patient') {
    return NextResponse.json({ error: 'Expected resourceType: Patient' }, { status: 422 })
  }

  // Extract fields from FHIR Patient
  const nameEntry = (body.name as Array<Record<string, unknown>>)?.[0]
  const full_name = (nameEntry?.text as string) ?? (nameEntry?.given as string[])?.[0] ?? ''
  const preferred_name = (nameEntry?.given as string[])?.[0] ?? null
  const phone = (body.telecom as Array<Record<string, unknown>>)?.find(t => t.system === 'phone')?.value as string ?? null
  const date_of_birth = (body.birthDate as string) ?? null
  const zip_code = (body.address as Array<Record<string, unknown>>)?.[0]?.postalCode as string ?? null

  if (!full_name) return NextResponse.json({ error: 'Patient name required' }, { status: 422 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('members')
    .insert({ full_name, preferred_name, phone, date_of_birth, zip_code } as any)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(memberToFhirPatient(data as Record<string, unknown>), {
    status: 201,
    headers: { 'Content-Type': 'application/fhir+json' }
  })
}
