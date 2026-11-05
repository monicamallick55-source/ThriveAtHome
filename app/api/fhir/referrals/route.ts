/**
 * app/api/fhir/referrals/route.ts — G5.9 FHIR R4 Referral Endpoint
 *
 * GET  /api/fhir/referrals          — list referrals (admin: all org; member: their own)
 * POST /api/fhir/referrals          — create a FHIR R4 ServiceRequest referral
 * GET  /api/fhir/referrals?id=uuid  — get single referral as FHIR R4 JSON
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const VALID_PRIORITY = ['routine', 'urgent', 'asap', 'stat']
const VALID_STATUS = ['draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown']
const VALID_INTENT = ['proposal', 'plan', 'directive', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']

// FHIR R4 ServiceRequest builder
function buildFHIRServiceRequest(referral: any, member: any) {
  return {
    resourceType: 'ServiceRequest',
    id: referral.id,
    meta: {
      versionId: '1',
      lastUpdated: referral.updated_at ?? referral.created_at,
      profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-servicerequest'],
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">Referral: ${referral.service_type} for ${member.first_name} ${member.last_name}</div>`,
    },
    status: referral.status ?? 'active',
    intent: referral.intent ?? 'order',
    priority: referral.priority ?? 'routine',
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: referral.snomed_code ?? '3457005',
          display: referral.service_type,
        },
      ],
      text: referral.service_type,
    },
    subject: {
      reference: `Patient/${referral.member_id}`,
      display: `${member.first_name} ${member.last_name}`,
    },
    requester: referral.requester_name
      ? { display: referral.requester_name }
      : undefined,
    performer: referral.performer_name
      ? [{ display: referral.performer_name }]
      : undefined,
    reasonCode: referral.reason_text
      ? [{ text: referral.reason_text }]
      : undefined,
    note: referral.notes
      ? [{ text: referral.notes }]
      : undefined,
    authoredOn: referral.created_at,
    occurrenceDateTime: referral.occurrence_datetime ?? undefined,
    patientInstruction: referral.patient_instruction ?? undefined,
    locationReference: referral.location_name
      ? [{ display: referral.location_name }]
      : undefined,
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('members')
      .select('id, org_id, role, first_name, last_name')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const url = new URL(req.url)
    const singleId = url.searchParams.get('id')
    const statusFilter = url.searchParams.get('status')
    const asFhir = url.searchParams.get('format') === 'fhir'
    const isAdmin = ['admin', 'navigator'].includes(member.role)

    // Single referral fetch
    if (singleId) {
      let query = supabase
        .from('fhir_referrals')
        .select('*, members!fhir_referrals_member_id_fkey(first_name, last_name)')
        .eq('id', singleId)
        .eq('org_id', member.org_id)

      if (!isAdmin) query = query.eq('member_id', member.id)

      const { data: referral, error } = await query.single()
      if (error || !referral) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const refMember = (referral as any).members ?? member
      if (asFhir) {
        return NextResponse.json(buildFHIRServiceRequest(referral, refMember), {
          headers: { 'Content-Type': 'application/fhir+json' },
        })
      }
      return NextResponse.json({ referral })
    }

    // List referrals
    let query = supabase
      .from('fhir_referrals')
      .select('*, members!fhir_referrals_member_id_fkey(first_name, last_name, email)')
      .eq('org_id', member.org_id)
      .order('created_at', { ascending: false })

    if (!isAdmin) query = query.eq('member_id', member.id)
    if (statusFilter) query = query.eq('status', statusFilter)

    const { data: referrals, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (asFhir) {
      // Return as FHIR R4 Bundle
      const entries = (referrals ?? []).map((r: any) => ({
        fullUrl: `urn:uuid:${r.id}`,
        resource: buildFHIRServiceRequest(r, r.members ?? member),
      }))
      return NextResponse.json({
        resourceType: 'Bundle',
        id: `bundle-${Date.now()}`,
        type: 'searchset',
        total: entries.length,
        entry: entries,
      }, { headers: { 'Content-Type': 'application/fhir+json' } })
    }

    return NextResponse.json({ referrals: referrals ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('members')
      .select('id, org_id, role, first_name, last_name')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const body = await req.json()

    // Support both native JSON and FHIR R4 ServiceRequest input
    let referralData: any

    if (body.resourceType === 'ServiceRequest') {
      // Parse from FHIR R4
      const fhir = body
      referralData = {
        service_type: fhir.code?.text ?? fhir.code?.coding?.[0]?.display ?? 'Unknown',
        snomed_code: fhir.code?.coding?.[0]?.code ?? null,
        status: fhir.status ?? 'active',
        intent: fhir.intent ?? 'order',
        priority: fhir.priority ?? 'routine',
        requester_name: fhir.requester?.display ?? null,
        performer_name: fhir.performer?.[0]?.display ?? null,
        reason_text: fhir.reasonCode?.[0]?.text ?? null,
        notes: fhir.note?.[0]?.text ?? null,
        patient_instruction: fhir.patientInstruction ?? null,
        occurrence_datetime: fhir.occurrenceDateTime ?? null,
        location_name: fhir.locationReference?.[0]?.display ?? null,
        // If admin, allow targeting a specific member; else default to self
        member_id: fhir.subject?.reference?.replace('Patient/', '') ?? member.id,
      }
    } else {
      // Native JSON
      const {
        service_type, status, intent, priority,
        requester_name, performer_name, reason_text, notes,
        patient_instruction, occurrence_datetime, location_name, snomed_code,
        member_id,
      } = body

      if (!service_type) {
        return NextResponse.json({ error: 'service_type is required' }, { status: 400 })
      }

      if (status && !VALID_STATUS.includes(status)) {
        return NextResponse.json({ error: `status must be one of: ${VALID_STATUS.join(', ')}` }, { status: 400 })
      }

      if (priority && !VALID_PRIORITY.includes(priority)) {
        return NextResponse.json({ error: `priority must be one of: ${VALID_PRIORITY.join(', ')}` }, { status: 400 })
      }

      if (intent && !VALID_INTENT.includes(intent)) {
        return NextResponse.json({ error: `intent must be one of: ${VALID_INTENT.join(', ')}` }, { status: 400 })
      }

      referralData = {
        service_type,
        snomed_code: snomed_code ?? null,
        status: status ?? 'active',
        intent: intent ?? 'order',
        priority: priority ?? 'routine',
        requester_name: requester_name ?? null,
        performer_name: performer_name ?? null,
        reason_text: reason_text ?? null,
        notes: notes ?? null,
        patient_instruction: patient_instruction ?? null,
        occurrence_datetime: occurrence_datetime ?? null,
        location_name: location_name ?? null,
        member_id: ['admin', 'navigator'].includes(member.role) && member_id ? member_id : member.id,
      }
    }

    const { data: referral, error } = await supabase
      .from('fhir_referrals')
      .insert({
        ...referralData,
        org_id: member.org_id,
        created_by: member.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Return FHIR ServiceRequest if input was FHIR
    if (body.resourceType === 'ServiceRequest') {
      return NextResponse.json(
        buildFHIRServiceRequest(referral, member),
        { status: 201, headers: { 'Content-Type': 'application/fhir+json' } }
      )
    }

    return NextResponse.json({ referral }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('members')
      .select('id, org_id, role')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!member || !['admin', 'navigator'].includes(member.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { id, status, notes, performer_name } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    if (status && !VALID_STATUS.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUS.join(', ')}` }, { status: 400 })
    }

    const updates: any = { updated_at: new Date().toISOString() }
    if (status !== undefined) updates.status = status
    if (notes !== undefined) updates.notes = notes
    if (performer_name !== undefined) updates.performer_name = performer_name

    const { data: referral, error } = await supabase
      .from('fhir_referrals')
      .update(updates)
      .eq('id', id)
      .eq('org_id', member.org_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ referral })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
