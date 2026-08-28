// M22 — Device & Smart Home Integration data layer (server-side, admin client).
import { createAdminClient } from '../supabase/admin'
import type {
  MemberDeviceRow,
  MemberDeviceInsert,
  WearableConnectionRow,
  WearableReadingRow,
  FallEventRow,
  EhrConnectionRow,
  FhirExportLogRow,
} from '../../types/database'
import type { WearableDailyReading } from '../interfaces/WearableProvider'

type Result<T> = { data: T; error: string | null }

// ─── Phase 87: Companion device + linked device registry ─────────────────────

export async function getDevicesForMember(
  memberId: string
): Promise<Result<MemberDeviceRow[]>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('member_devices')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
  return { data: (data ?? []) as MemberDeviceRow[], error: error?.message ?? null }
}

export async function registerDevice(
  insert: MemberDeviceInsert
): Promise<Result<MemberDeviceRow | null>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('member_devices')
    .insert(insert)
    .select('*')
    .maybeSingle()
  return { data: (data as MemberDeviceRow | null) ?? null, error: error?.message ?? null }
}

export async function updateDevice(
  id: string,
  patch: Partial<MemberDeviceInsert>
): Promise<Result<MemberDeviceRow | null>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('member_devices')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle()
  return { data: (data as MemberDeviceRow | null) ?? null, error: error?.message ?? null }
}

export async function disconnectDevice(id: string): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('member_devices')
    .update({ status: 'disconnected' })
    .eq('id', id)
  return { error: error?.message ?? null }
}

// ─── Phase 89: Smart-home signals ───────────────────────────────────────────

export async function recordDeviceSignal(params: {
  memberId: string
  deviceId?: string | null
  signalType: string
  signalValue?: Record<string, unknown>
  occurredAt?: string
}): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const { error } = await admin.from('device_signals').insert({
    member_id: params.memberId,
    device_id: params.deviceId ?? null,
    signal_type: params.signalType,
    signal_value: params.signalValue ?? {},
    occurred_at: params.occurredAt ?? new Date().toISOString(),
  })
  return { error: error?.message ?? null }
}

// ─── Phase 90: Wearables ────────────────────────────────────────────────────

export async function getWearableConnectionsForMember(
  memberId: string
): Promise<Result<WearableConnectionRow[]>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('wearable_connections')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
  return { data: (data ?? []) as WearableConnectionRow[], error: error?.message ?? null }
}

export async function upsertWearableConnection(params: {
  memberId: string
  platform: string
  externalUserId: string
  scopes: string[]
  status: string
}): Promise<Result<WearableConnectionRow | null>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('wearable_connections')
    .upsert(
      {
        member_id: params.memberId,
        platform: params.platform,
        external_user_id: params.externalUserId,
        scopes: params.scopes,
        status: params.status,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'member_id,platform' }
    )
    .select('*')
    .maybeSingle()
  return { data: (data as WearableConnectionRow | null) ?? null, error: error?.message ?? null }
}

export async function revokeWearableConnection(id: string): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('wearable_connections')
    .update({ status: 'revoked' })
    .eq('id', id)
  return { error: error?.message ?? null }
}

export async function getRecentWearableReadings(
  memberId: string,
  days = 14
): Promise<Result<WearableReadingRow[]>> {
  const admin = createAdminClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const { data, error } = await admin
    .from('wearable_readings')
    .select('*')
    .eq('member_id', memberId)
    .gte('reading_date', since)
    .order('reading_date', { ascending: false })
  return { data: (data ?? []) as WearableReadingRow[], error: error?.message ?? null }
}

export async function saveWearableReadings(params: {
  memberId: string
  connectionId: string | null
  platform: string
  readings: WearableDailyReading[]
}): Promise<{ saved: number; error: string | null }> {
  const admin = createAdminClient()
  if (params.readings.length === 0) return { saved: 0, error: null }
  const rows = params.readings.map((r) => ({
    member_id: params.memberId,
    connection_id: params.connectionId,
    reading_date: r.readingDate,
    steps: r.steps,
    resting_heart_rate: r.restingHeartRate,
    sleep_hours: r.sleepHours,
    active_minutes: r.activeMinutes,
    fall_detected: r.fallDetected,
    source_platform: params.platform,
  }))
  const { error, count } = await admin
    .from('wearable_readings')
    .upsert(rows, { onConflict: 'member_id,reading_date,source_platform', count: 'exact' })
  return { saved: count ?? rows.length, error: error?.message ?? null }
}

// ─── Phase 91: Fall events ──────────────────────────────────────────────────

export async function getFallEventsForMember(
  memberId: string,
  limit = 20
): Promise<Result<FallEventRow[]>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('fall_events')
    .select('*')
    .eq('member_id', memberId)
    .order('detected_at', { ascending: false })
    .limit(limit)
  return { data: (data ?? []) as FallEventRow[], error: error?.message ?? null }
}

export async function resolveFallEvent(
  id: string,
  note: string
): Promise<Result<FallEventRow | null>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('fall_events')
    .update({ resolved: true, resolved_at: new Date().toISOString(), resolution_note: note })
    .eq('id', id)
    .select('*')
    .maybeSingle()
  return { data: (data as FallEventRow | null) ?? null, error: error?.message ?? null }
}

// ─── Phase 92: EHR / FHIR ───────────────────────────────────────────────────

export async function getEhrConnectionsForMember(
  memberId: string
): Promise<Result<EhrConnectionRow[]>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ehr_connections')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
  return { data: (data ?? []) as EhrConnectionRow[], error: error?.message ?? null }
}

export async function upsertEhrConnection(params: {
  memberId: string
  ehrSystem: string
  fhirBaseUrl: string | null
  patientFhirId: string
  scopes: string[]
  status: string
}): Promise<Result<EhrConnectionRow | null>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ehr_connections')
    .upsert(
      {
        member_id: params.memberId,
        ehr_system: params.ehrSystem,
        fhir_base_url: params.fhirBaseUrl,
        patient_fhir_id: params.patientFhirId,
        scopes: params.scopes,
        status: params.status,
        consent_granted_at: new Date().toISOString(),
      },
      { onConflict: 'member_id,ehr_system' }
    )
    .select('*')
    .maybeSingle()
  return { data: (data as EhrConnectionRow | null) ?? null, error: error?.message ?? null }
}

export async function revokeEhrConnection(id: string): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const { error } = await admin.from('ehr_connections').update({ status: 'revoked' }).eq('id', id)
  return { error: error?.message ?? null }
}

export async function logFhirExport(params: {
  memberId: string
  connectionId: string | null
  resourceType: string
  resourceCount: number
  exportStatus: string
  payloadSummary: string
}): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const { error } = await admin.from('fhir_export_log').insert({
    member_id: params.memberId,
    connection_id: params.connectionId,
    resource_type: params.resourceType,
    resource_count: params.resourceCount,
    export_status: params.exportStatus,
    payload_summary: params.payloadSummary,
  })
  if (error) console.error('[data/devices/logFhirExport]', error)
  return { error: error?.message ?? null }
}

export async function getFhirExportLog(
  memberId: string,
  limit = 20
): Promise<Result<FhirExportLogRow[]>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('fhir_export_log')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data: (data ?? []) as FhirExportLogRow[], error: error?.message ?? null }
}

// ─── Dashboard summary ──────────────────────────────────────────────────────

export interface DeviceSummary {
  totalDevices: number
  activeDevices: number
  wearablesConnected: number
  ehrConnected: boolean
  fallProtectionActive: boolean
  unresolvedFalls: number
}

export async function getDeviceSummaryForMember(
  memberId: string
): Promise<Result<DeviceSummary>> {
  const admin = createAdminClient()
  const [devicesRes, wearablesRes, ehrRes, fallsRes] = await Promise.all([
    admin.from('member_devices').select('status').eq('member_id', memberId),
    admin.from('wearable_connections').select('status').eq('member_id', memberId).eq('status', 'active'),
    admin.from('ehr_connections').select('status').eq('member_id', memberId).eq('status', 'active'),
    admin.from('fall_events').select('id').eq('member_id', memberId).eq('resolved', false),
  ])

  const devices = devicesRes.data ?? []
  const activeDevices = devices.filter((d) => d.status === 'active').length
  const wearablesConnected = (wearablesRes.data ?? []).length

  const summary: DeviceSummary = {
    totalDevices: devices.length,
    activeDevices,
    wearablesConnected,
    ehrConnected: (ehrRes.data ?? []).length > 0,
    fallProtectionActive: wearablesConnected > 0 || activeDevices > 0,
    unresolvedFalls: (fallsRes.data ?? []).length,
  }
  return { data: summary, error: devicesRes.error?.message ?? null }
}
