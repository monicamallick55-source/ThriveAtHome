import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'login', diagnostics: 'Unauthorized' }] }, { status: 401 })

  const admin = createAdminClient()

  const { data: fm } = await admin
    .from('family_members')
    .select('member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm?.member_id) return NextResponse.json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: 'No member record found' }] }, { status: 404 })

  const { data: memberRaw } = await admin
    .from('members')
    .select('id, full_name, preferred_name, date_of_birth, phone_number, plan_tier')
    .eq('id', fm.member_id)
    .maybeSingle()

  if (!memberRaw) return NextResponse.json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: 'Member not found' }] }, { status: 404 })

  const member = memberRaw as typeof memberRaw & { is_veteran?: boolean; medicare_number?: string }

  if (!['premium', 'concierge'].includes(member.plan_tier ?? '')) {
    return NextResponse.json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'forbidden', diagnostics: 'FHIR export requires Premium or Concierge plan' }] }, { status: 403 })
  }

  const nameParts = (member.full_name ?? '').trim().split(' ')
  const family = nameParts.length > 1 ? nameParts.slice(-1)[0] : nameParts[0]
  const given = nameParts.length > 1 ? nameParts.slice(0, -1) : []

  const patient = {
    resourceType: 'Patient',
    id: member.id,
    meta: { profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient'] },
    identifier: member.medicare_number ? [{ system: 'http://hl7.org/fhir/sid/us-medicare', value: member.medicare_number }] : [],
    name: [{ use: 'official', family, given }],
    telecom: member.phone_number ? [{ system: 'phone', value: member.phone_number, use: 'mobile' }] : [],
    birthDate: member.date_of_birth ?? undefined,
    extension: member.is_veteran ? [{ url: 'http://hl7.org/fhir/us/military-service/StructureDefinition/military-service-episode', valueBoolean: true }] : [],
  }

  return NextResponse.json(patient, {
    headers: { 'Content-Type': 'application/fhir+json; charset=utf-8' }
  })
}
