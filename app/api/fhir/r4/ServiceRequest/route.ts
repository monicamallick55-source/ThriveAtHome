// FHIR R4 ServiceRequest — hospital referral intake
// POST: accepts a FHIR ServiceRequest bundle, stores in hospital_referrals,
//       creates a navigator task, and returns a FHIR OperationOutcome.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function fhirError(status: number, code: string, diagnostics: string) {
  return NextResponse.json({
    resourceType: 'OperationOutcome',
    issue: [{ severity: 'error', code, diagnostics }],
  }, {
    status,
    headers: { 'Content-Type': 'application/fhir+json' },
  })
}

export async function POST(req: NextRequest) {
  // Bearer token auth — use FHIR_API_SECRET env var
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || token !== process.env.FHIR_API_SECRET) {
    return fhirError(401, 'security', 'Invalid or missing Bearer token')
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return fhirError(400, 'invalid', 'Request body must be valid JSON')
  }

  if (body.resourceType !== 'ServiceRequest') {
    return fhirError(400, 'invalid', 'resourceType must be ServiceRequest')
  }

  // Extract member by identifier (MR number stored in members.mrn or phone)
  const identifiers: Array<{ system?: string; value?: string }> = (body.subject as any)?.identifier
    ? [(body.subject as any).identifier]
    : []

  const admin = createAdminClient()
  let memberId: string | null = null

  for (const id of identifiers) {
    if (!id.value) continue
    const { data: m } = await admin.from('members')
      .select('id')
      .or(`mrn.eq.${id.value},phone_number.eq.${id.value},phone.eq.${id.value}`)
      .maybeSingle()
    if (m) { memberId = (m as any).id; break }
  }

  if (!memberId) {
    return fhirError(404, 'not-found', 'No member found matching the subject identifier')
  }

  // Extract fields
  const priority = String((body.priority as string) ?? 'routine').toLowerCase()
  const validPriorities = ['routine', 'urgent', 'asap', 'stat']
  const safePriority = validPriorities.includes(priority) ? priority : 'routine'

  const reasonCode = (body.reasonCode as any[])?.[0]?.coding?.[0]?.code ?? null
  const reasonText = (body.reasonCode as any[])?.[0]?.text
    ?? (body.reasonCode as any[])?.[0]?.coding?.[0]?.display
    ?? null

  const referringOrg = (body.requester as any)?.display
    ?? (body.requester as any)?.reference
    ?? null

  const fhirRequestId = String(body.id ?? '').trim() || null

  // Store referral
  const { data: referral, error } = await (admin.from as any)('hospital_referrals').insert({
    member_id: memberId,
    fhir_request_id: fhirRequestId,
    referring_org: referringOrg,
    reason_code: reasonCode,
    reason_text: reasonText,
    priority: safePriority,
    status: 'active',
    authored_on: (body.authoredOn as string) ?? new Date().toISOString(),
    raw_payload: body,
  }).select('id').maybeSingle()

  if (error) {
    console.error('[fhir/ServiceRequest] insert error:', error.message)
    return fhirError(500, 'exception', 'Failed to store referral')
  }

  // Create navigator task
  const taskPriority = safePriority === 'stat' || safePriority === 'asap' ? 'critical' : safePriority === 'urgent' ? 'high' : 'medium'
  await admin.from('navigator_tasks').insert({
    member_id: memberId,
    task_type: 'hospital_referral',
    priority: taskPriority,
    description: `Hospital referral received${referringOrg ? ` from ${referringOrg}` : ''}${reasonText ? `: ${reasonText}` : ''}. Priority: ${safePriority}.`,
  } as any)

  return NextResponse.json({
    resourceType: 'OperationOutcome',
    id: (referral as any)?.id,
    issue: [{ severity: 'information', code: 'informational', diagnostics: 'ServiceRequest accepted and referral created.' }],
  }, {
    status: 201,
    headers: { 'Content-Type': 'application/fhir+json' },
  })
}
