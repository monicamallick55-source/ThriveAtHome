// lib/fraud/flagService.ts
// G7.1 — Creates fraud_flags rows + navigator tasks + (for urgent) family SMS notifications.
// Used from: processCallEnded, circles/report hook, gift orders, navigator/family manual reports.

import { createAdminClient } from '@/lib/supabase/admin'
import type { FraudMatch, ScamType } from './detect'

export type FraudSource =
  | 'call_transcript'
  | 'community_post'
  | 'private_message'
  | 'gift_order'
  | 'navigator'
  | 'family'
  | 'buddy'

interface CreateFraudFlagOptions {
  memberId: string
  source: FraudSource
  sourceId?: string          // the call_id, post_id, etc.
  match: FraudMatch
}

/**
 * Insert a fraud_flags row, create a navigator task, and (if urgent) queue a family notification.
 * Safe to call multiple times — does NOT dedup (caller may batch distinct types).
 */
export async function createFraudFlag(opts: CreateFraudFlagOptions): Promise<string | null> {
  const admin = createAdminClient()
  const { memberId, source, sourceId, match } = opts

  // 1. Insert fraud_flags row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: flag, error: flagErr } = await (admin as any)
    .from('fraud_flags')
    .insert({
      member_id: memberId,
      source,
      source_id: sourceId ?? null,
      scam_type: match.scamType,
      matched_text: match.excerpt,
      severity: match.severity,
      status: 'open',
    })
    .select('id')
    .maybeSingle()

  if (flagErr || !flag) {
    console.error('[createFraudFlag] insert failed:', flagErr)
    return null
  }

  const flagId = flag.id as string

  // 2. Navigator task
  const priority = match.severity === 'urgent' ? 'critical' : 'high'
  const taskDescription = buildTaskDescription(match, source, sourceId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: task, error: taskErr } = await (admin as any)
    .from('navigator_tasks')
    .insert({
      member_id: memberId,
      task_type: 'fraud_flag',
      priority,
      description: taskDescription,
      metadata: { fraud_flag_id: flagId, scam_type: match.scamType, severity: match.severity },
    })
    .select('id')
    .maybeSingle()

  if (taskErr) {
    console.error('[createFraudFlag] navigator task failed:', taskErr)
  } else if (task) {
    // Update fraud_flag with task reference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('fraud_flags')
      .update({ navigator_task_id: task.id })
      .eq('id', flagId)
  }

  // 3. Family notification for urgent flags
  if (match.severity === 'urgent') {
    await notifyFamilyUrgent(memberId, flagId, match)
  }

  return flagId
}

/**
 * Process a block of text (e.g. call transcript) for fraud patterns and create flags for any matches.
 * Returns array of created flag IDs.
 */
export async function scanAndFlag(
  text: string,
  memberId: string,
  source: FraudSource,
  sourceId?: string,
): Promise<string[]> {
  const { scanForFraudPatterns } = await import('./detect')
  const matches = scanForFraudPatterns(text)
  if (matches.length === 0) return []

  const ids: string[] = []
  for (const match of matches) {
    const id = await createFraudFlag({ memberId, source, sourceId, match })
    if (id) ids.push(id)
  }
  return ids
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const SCAM_TYPE_LABELS: Record<ScamType, string> = {
  gift_card: 'Gift Card Scam',
  government_impersonation: 'Government Impersonation',
  grandparent: 'Grandparent Scam',
  romance: 'Romance Scam',
  tech_support: 'Tech Support Scam',
  lottery_prize: 'Lottery / Prize Scam',
  investment_crypto: 'Crypto / Investment Scam',
  charity: 'Charity Scam',
  large_purchase: 'Large Purchase Fraud',
  other: 'Suspected Fraud',
}

function buildTaskDescription(match: FraudMatch, source: FraudSource, sourceId?: string): string {
  const label = SCAM_TYPE_LABELS[match.scamType] ?? 'Fraud'
  const urgencyNote = match.severity === 'urgent' ? ' ⚠️ URGENT — possible active scam' : ''
  const sourceNote = source === 'call_transcript'
    ? `Detected in call transcript (call id: ${sourceId ?? 'unknown'})`
    : source === 'community_post'
    ? `Detected in community post/comment`
    : source === 'family'
    ? 'Reported by family member'
    : source === 'navigator'
    ? 'Flagged by navigator'
    : `Detected in ${source}`

  return `${label} detected.${urgencyNote} ${sourceNote}. Excerpt: "${match.excerpt}". Please review and contact member.`
}

async function notifyFamilyUrgent(
  memberId: string,
  flagId: string,
  match: FraudMatch,
): Promise<void> {
  const admin = createAdminClient()

  // Mark family_notified_at
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('fraud_flags')
    .update({ family_notified_at: new Date().toISOString() })
    .eq('id', flagId)

  // Log notification (SMS sending would happen here in production via Twilio/Retell)
  console.log(`[FraudFlag][URGENT] Member ${memberId} — ${match.scamType} — family SMS queued (stub)`)

  // In production: query family_members for member, send SMS via Twilio to each who has notify_sms=true
  // For now: stub log only
}
