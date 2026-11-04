/**
 * app/api/fhir/referral/route.ts — G5.9
 * POST /api/fhir/referral
 * Accepts an HL7 FHIR R4 ServiceRequest and creates a transition plan + navigator task.
 * Used by hospital discharge systems and EHR integrations.
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface FHIRCoding { system?: string; code?: string; display?: string }
interface FHIRCodeableConcept { coding?: FHIRCoding[]; text?: string }
interface FHIRReference { reference?: string; display?: string }
interface FHIRServiceRequest {
  resourceType: 'ServiceRequest'
  id?: string
  status: string
  intent: string
  code?: FHIRCodeableConcept
  subject: FHIRReference
  requester?: FHIRReference
  note?: Array<{ text: string }>
  occurrenceDateTime?: string
  reasonCode?: FHIRCodeableConcept[]
}

function extractMemberId(ref: string | undefined): string | null {
  if (!ref) return null
  // e.g. "Patient/12345" or just a UUID
  const parts = ref.split('/')
  return parts[parts.length - 1] ?? null
}

export async function POST(req: NextRequest) {
  try {
    // Validate bearer token (EHR systems send their own auth)
    const auth = req.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Bearer token required' }, { status: 401 })
    }

    const supabase = await createClient()
    const body: FHIRServiceRequest = await req.json()

    if (body.resourceType !== 'ServiceRequest') {
      return NextResponse.json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'invalid', diagnostics: 'Expected ServiceRequest resource' }]
      }, { status: 400 })
    }

    const memberId = extractMemberId(body.subject?.reference)
    if (!memberId) {
      return NextResponse.json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'required', diagnostics: 'subject.reference is required' }]
      }, { status: 400 })
    }

    // Look up member
    const { data: member } = await supabase
      .from('members')
      .select('id, full_name')
      .eq('id', memberId)
      .single()

    if (!member) {
      return NextResponse.json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'not-found', diagnostics: `Member ${memberId} not found` }]
      }, { status: 404 })
    }

    const serviceCode = body.code?.coding?.[0]?.code ?? 'general'
    const serviceDisplay = body.code?.text ?? body.code?.coding?.[0]?.display ?? 'Community care referral'
    const notes = body.note?.map(n => n.text).join(' ') ?? ''
    const requesterName = body.requester?.display ?? 'Referring provider'

    // Map FHIR service codes to plan types
    const PLAN_TYPE_MAP: Record<string, string> = {
      '308292007': 'facility_move',      // Transfer of care
      '390906007': 'home_care',          // Follow-up encounter
      '11429006':  'consultation',       // Consultation
    }
    const planType = PLAN_TYPE_MAP[serviceCode] ?? 'general_transition'

    // Create transition plan
    const { data: plan, error: planError } = await supabase
      .from('transition_plans')
      .insert({
        member_id: member.id,
        plan_type: planType,
        status: 'active',
        source: 'fhir_referral',
        fhir_request_id: body.id,
        notes: `Referred by ${requesterName}. ${notes}`.trim(),
      })
      .select()
      .single()

    if (planError) {
      return NextResponse.json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'processing', diagnostics: planError.message }]
      }, { status: 400 })
    }

    // Create navigator task
    await supabase.from('navigator_tasks').insert({
      member_id: member.id,
      task_type: 'fhir_referral',
      notes: `FHIR referral received from ${requesterName}: ${serviceDisplay}. ${notes}`,
      priority: 'high',
      status: 'pending',
      metadata: { fhir_request_id: body.id, plan_id: plan.id },
    })

    // Return FHIR-compliant response
    return NextResponse.json({
      resourceType: 'ServiceRequest',
      id: plan.id,
      status: 'active',
      intent: 'order',
      subject: body.subject,
      extension: [{
        url: 'https://thriveatHome.com/fhir/extension/transition-plan-id',
        valueString: plan.id,
      }],
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }]
    }, { status: 500 })
  }
}
