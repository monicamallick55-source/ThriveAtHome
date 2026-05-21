// Navigator data access functions — server-side only, uses admin client.
import { createAdminClient } from '../supabase/admin'
import type { Database } from '../../types/database'
import type { Member } from './members'
import type { CheckInCall } from './calls'
import type { Alert } from './alerts'

export type CareNavigator = Database['public']['Tables']['care_navigators']['Row']
export type NavigatorTask = Database['public']['Tables']['navigator_tasks']['Row']

const SEVERITY_ORDER: Record<string, number> = {
  emergency: 4, urgent: 3, concern: 2, informational: 1,
}

export type WorstSeverity = 'emergency' | 'urgent' | 'concern' | 'informational' | null

function getWorstSeverity(alerts: Alert[]): WorstSeverity {
  if (alerts.length === 0) return null
  let worst: WorstSeverity = 'informational'
  for (const a of alerts) {
    if ((SEVERITY_ORDER[a.severity] ?? 0) > (SEVERITY_ORDER[worst ?? ''] ?? 0)) {
      worst = a.severity as WorstSeverity
    }
  }
  return worst
}

export type CaseloadEntry = {
  member: Member
  latestCall: CheckInCall | null
  unacknowledgedAlerts: Alert[]
  worstSeverity: WorstSeverity
}

/** Find the care_navigator row linked to a Supabase auth user ID. */
export async function getNavigatorByAuthId(
  authUserId: string
): Promise<{ data: CareNavigator | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('care_navigators')
      .select('*')
      .eq('supabase_auth_id', authUserId)
      .maybeSingle()
    if (error) {
      console.error('[data/navigator/getNavigatorByAuthId]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Not found' }
    return { data: data as CareNavigator, error: null }
  } catch (e) {
    console.error('[data/navigator/getNavigatorByAuthId] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Get all members assigned to a navigator with their latest call and
 * unacknowledged alerts, sorted by worst alert severity then name.
 */
export async function getNavigatorCaseload(
  navigatorId: string
): Promise<{ data: CaseloadEntry[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()

    const { data: assignments, error: aErr } = await admin
      .from('navigator_assignments')
      .select('member_id')
      .eq('navigator_id', navigatorId)
    if (aErr) {
      console.error('[data/navigator/getNavigatorCaseload] assignments:', aErr)
      return { data: null, error: aErr.message }
    }

    const memberIds = (assignments ?? []).map(a => a.member_id)
    if (memberIds.length === 0) return { data: [], error: null }

    const { data: members, error: mErr } = await admin
      .from('members')
      .select('*')
      .in('id', memberIds)
    if (mErr) {
      console.error('[data/navigator/getNavigatorCaseload] members:', mErr)
      return { data: null, error: mErr.message }
    }

    const [callsResult, alertsResult] = await Promise.all([
      admin
        .from('check_in_calls')
        .select('*')
        .in('member_id', memberIds)
        .order('created_at', { ascending: false }),
      admin
        .from('alerts')
        .select('*')
        .in('member_id', memberIds)
        .eq('acknowledged', false)
        .order('created_at', { ascending: false }),
    ])

    if (callsResult.error) console.error('[data/navigator/getNavigatorCaseload] calls:', callsResult.error)
    if (alertsResult.error) console.error('[data/navigator/getNavigatorCaseload] alerts:', alertsResult.error)

    // Keep only the most recent call per member
    const callsByMember = new Map<string, CheckInCall>()
    for (const call of (callsResult.data ?? [])) {
      if (!callsByMember.has(call.member_id)) {
        callsByMember.set(call.member_id, call as CheckInCall)
      }
    }

    const alertsByMember = new Map<string, Alert[]>()
    for (const alert of (alertsResult.data ?? [])) {
      const existing = alertsByMember.get(alert.member_id) ?? []
      existing.push(alert as Alert)
      alertsByMember.set(alert.member_id, existing)
    }

    const caseload: CaseloadEntry[] = (members ?? []).map(member => {
      const memberAlerts = alertsByMember.get(member.id) ?? []
      return {
        member: member as Member,
        latestCall: callsByMember.get(member.id) ?? null,
        unacknowledgedAlerts: memberAlerts,
        worstSeverity: getWorstSeverity(memberAlerts),
      }
    })

    // Sort: emergency → urgent → concern → informational → none → alphabetical
    caseload.sort((a, b) => {
      const aOrd = SEVERITY_ORDER[a.worstSeverity ?? ''] ?? 0
      const bOrd = SEVERITY_ORDER[b.worstSeverity ?? ''] ?? 0
      if (bOrd !== aOrd) return bOrd - aOrd
      return a.member.full_name.localeCompare(b.member.full_name)
    })

    return { data: caseload, error: null }
  } catch (e) {
    console.error('[data/navigator/getNavigatorCaseload] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Get incomplete tasks assigned to a navigator. */
export async function getNavigatorTasks(
  navigatorId: string
): Promise<{ data: NavigatorTask[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('navigator_tasks')
      .select('*')
      .eq('navigator_id', navigatorId)
      .eq('completed', false)
      .order('created_at', { ascending: true })
    if (error) {
      console.error('[data/navigator/getNavigatorTasks]', error)
      return { data: null, error: error.message }
    }
    return { data: (data ?? []) as NavigatorTask[], error: null }
  } catch (e) {
    console.error('[data/navigator/getNavigatorTasks] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}
