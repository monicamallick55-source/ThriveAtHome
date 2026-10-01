// Urgent SMS to the humans on call: the CARE_TEAM_PHONE on-call number plus the
// member's assigned navigator (primary first). Never throws — a failed or missing
// text must not stop the navigator task / alert that the caller has already created.
import { createAdminClient } from '../supabase/admin'
import { smsProvider } from '../providers'
import { envKey } from '../env'
import { toE164 } from '../voice/phone'

export interface CareTeamSmsResult {
  sentTo: string[]
  errors: string[]
}

const E164 = /^\+[1-9]\d{7,14}$/

/** The on-call number from CARE_TEAM_PHONE, or null (logged) when missing or not E.164. */
export function careTeamPhone(): string | null {
  const raw = envKey('CARE_TEAM_PHONE')
  if (!raw) {
    console.error('[alerts/careTeam] CARE_TEAM_PHONE is not set — urgent SMS not sent to the on-call number')
    return null
  }
  if (!E164.test(raw)) {
    console.error('[alerts/careTeam] CARE_TEAM_PHONE is not in E.164 format (e.g. +14155550100) — urgent SMS not sent to the on-call number')
    return null
  }
  return raw
}

/** Phone of the member's assigned navigator (primary, else most recent), normalised to E.164. */
export async function assignedNavigatorPhone(memberId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data: assignment, error } = await admin
    .from('navigator_assignments')
    .select('navigator_id, is_primary, assigned_at')
    .eq('member_id', memberId)
    .order('is_primary', { ascending: false })
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('[alerts/careTeam] navigator assignment lookup failed:', error.message)
    return null
  }
  if (!assignment) return null

  const { data: nav, error: navErr } = await admin
    .from('care_navigators')
    .select('phone, is_active')
    .eq('id', assignment.navigator_id)
    .maybeSingle()
  if (navErr) {
    console.error('[alerts/careTeam] navigator lookup failed:', navErr.message)
    return null
  }
  if (!nav?.is_active) return null
  return toE164(nav.phone)
}

/**
 * Sends `body` as an urgent SMS to the on-call number and, when memberId is given, the
 * member's assigned navigator. `onCallOverride` replaces CARE_TEAM_PHONE (tests only).
 */
export async function sendCareTeamUrgent(
  memberId: string | null,
  body: string,
  onCallOverride?: string,
): Promise<CareTeamSmsResult> {
  const result: CareTeamSmsResult = { sentTo: [], errors: [] }
  const recipients = new Set<string>()

  const onCall = onCallOverride ?? careTeamPhone()
  if (onCall) recipients.add(onCall)
  else result.errors.push('CARE_TEAM_PHONE missing')

  if (memberId) {
    try {
      const navPhone = await assignedNavigatorPhone(memberId)
      if (navPhone) recipients.add(navPhone)
    } catch (e) {
      result.errors.push(`navigator lookup: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  await Promise.all([...recipients].map(async to => {
    try {
      await smsProvider.sendUrgent(to, body)
      result.sentTo.push(to)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[alerts/careTeam] urgent SMS to ${to.substring(0, 6)}xxx failed:`, msg)
      result.errors.push(msg)
    }
  }))

  if (result.sentTo.length === 0) {
    console.error('[alerts/careTeam] urgent SMS reached nobody — rely on the navigator task and Realtime alert')
  }
  return result
}
