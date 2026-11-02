// app/api/fhir/route.ts
// GET  — list FHIR connections for authenticated member
// POST — add a FHIR connection and trigger initial sync

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPPORTED_RESOURCE_TYPES = ['Condition', 'MedicationRequest', 'Observation', 'AllergyIntolerance']

async function syncFhirResources(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  connectionId: string,
  memberId: string,
  serverUrl: string,
  patientId: string,
  accessToken: string | null
) {
  const headers: Record<string, string> = { Accept: 'application/fhir+json' }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  let synced = 0
  for (const resourceType of SUPPORTED_RESOURCE_TYPES) {
    try {
      const url = `${serverUrl}/${resourceType}?patient=${patientId}&_count=50`
      const res = await fetch(url, { headers })
      if (!res.ok) continue
      const bundle = await res.json() as { entry?: Array<{ resource: { id: string; effectiveDateTime?: string; recordedDate?: string; authoredOn?: string; onset?: string } }> }

      for (const entry of (bundle.entry ?? [])) {
        const resource = entry.resource
        if (!resource?.id) continue
        const recordedAt = resource.effectiveDateTime ?? resource.recordedDate ?? resource.authoredOn ?? resource.onset ?? null
        await db.from('fhir_resources').upsert(
          { connection_id: connectionId, member_id: memberId, resource_type: resourceType, resource_id: resource.id, resource_data: resource, recorded_at: recordedAt },
          { onConflict: 'connection_id,resource_type,resource_id' }
        )
        synced++
      }
    } catch { /* skip resource type on error */ }
  }
  return synced
}

export async function GET(_req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const { data: member } = await db.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { data: connections } = await db
    .from('fhir_connections')
    .select('id, fhir_server_url, patient_id, status, last_synced_at, error_message')
    .eq('member_id', member.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ connections: connections ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    fhir_server_url?: string
    patient_id?: string
    access_token?: string
  }

  if (!body.fhir_server_url || !body.patient_id) {
    return NextResponse.json({ error: 'fhir_server_url and patient_id required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const { data: member } = await db.from('members').select('id, plan_tier').eq('supabase_auth_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // FHIR sync requires Complete or Premier plan
  if (member.plan_tier === 'basic') {
    return NextResponse.json({ error: 'FHIR health sync requires Complete or Premier plan' }, { status: 403 })
  }

  const serverUrl = body.fhir_server_url.replace(/\/$/, '')

  const { data: connection, error } = await db
    .from('fhir_connections')
    .upsert(
      { member_id: member.id, fhir_server_url: serverUrl, patient_id: body.patient_id, access_token: body.access_token ?? null, status: 'active', error_message: null },
      { onConflict: 'member_id,fhir_server_url' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Initial sync
  let synced = 0
  try {
    synced = await syncFhirResources(db, connection.id, member.id, serverUrl, body.patient_id, body.access_token ?? null)
    await db.from('fhir_connections').update({ last_synced_at: new Date().toISOString() }).eq('id', connection.id)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Sync failed'
    await db.from('fhir_connections').update({ status: 'error', error_message: msg }).eq('id', connection.id)
  }

  return NextResponse.json({ connection, synced_resources: synced }, { status: 201 })
}
