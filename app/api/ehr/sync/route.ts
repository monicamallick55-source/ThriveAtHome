// M22 Phase 92 — push wellness data to a member's EHR as FHIR resources.
// Builds the FHIR bundle (Observations from calls + wearable readings, Conditions
// from flagged alerts), runs it through ehrProvider (stub logs only), and records
// each export in fhir_export_log.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { ehrProvider } from '@/lib/providers'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildFhirBundleForMember } from '@/lib/devices/fhirMapping'
import { logFhirExport } from '@/lib/data/devices'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'Complete onboarding first.' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const connectionId = typeof body?.connection_id === 'string' ? body.connection_id : null

  const admin = createAdminClient()
  let q = admin
    .from('ehr_connections')
    .select('id, ehr_system, patient_fhir_id, status')
    .eq('member_id', fm.member_id)
    .eq('status', 'active')
  if (connectionId) q = q.eq('id', connectionId)
  const { data: connections } = await q

  if (!connections || connections.length === 0) {
    return NextResponse.json({ error: 'No active EHR connection to export to.' }, { status: 400 })
  }

  const bundle = await buildFhirBundleForMember(fm.member_id, 30)
  const results: Array<{ system: string; observations: number; conditions: number }> = []

  for (const conn of connections) {
    if (!conn.patient_fhir_id) continue

    const obsResult = await ehrProvider.exportObservations(conn.patient_fhir_id, bundle.observations)
    await logFhirExport({
      memberId: fm.member_id,
      connectionId: conn.id,
      resourceType: 'Observation',
      resourceCount: obsResult.resourceCount,
      exportStatus: obsResult.status,
      payloadSummary: obsResult.summary,
    })

    const condResult = await ehrProvider.exportConditions(conn.patient_fhir_id, bundle.conditions)
    await logFhirExport({
      memberId: fm.member_id,
      connectionId: conn.id,
      resourceType: 'Condition',
      resourceCount: condResult.resourceCount,
      exportStatus: condResult.status,
      payloadSummary: condResult.summary,
    })

    await admin
      .from('ehr_connections')
      .update({ last_export_at: new Date().toISOString() })
      .eq('id', conn.id)

    results.push({
      system: conn.ehr_system,
      observations: obsResult.resourceCount,
      conditions: condResult.resourceCount,
    })
  }

  return NextResponse.json({ exported: results })
}
