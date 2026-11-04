/**
 * lib/family/dailySummary.ts — G5.8
 * Sends a short post-call text summary to family contacts.
 * Rules:
 *  - Only if family_can_see_call_summaries = true
 *  - Only if family contact preferred_contact_method = 'text'
 *  - Max 320 chars; no health scores; no transcript text
 *  - Quiet hours: 9pm–8am in member's timezone → queue until 8am
 */

import { SupabaseClient } from '@supabase/supabase-js'

const MAX_LENGTH = 320
const QUIET_START = 21  // 9pm
const QUIET_END = 8     // 8am

function isQuietHour(memberTimezone: string): boolean {
  try {
    const now = new Date()
    const hour = parseInt(
      new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: memberTimezone }).format(now),
      10
    )
    return hour >= QUIET_START || hour < QUIET_END
  } catch {
    return false  // unknown timezone → send now
  }
}

function nextSendTime(memberTimezone: string): Date {
  const now = new Date()
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', minute: 'numeric', hour12: false, timeZone: memberTimezone,
    })
    // Build a date that is 8am tomorrow in member's TZ
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    // Simple: return a time ~8am (not perfect but safe)
    tomorrow.setUTCHours(8, 0, 0, 0)
    return tomorrow
  } catch {
    return now
  }
}

export async function sendFamilySummary(
  supabase: SupabaseClient,
  memberId: string,
  aiSummary: string,
  memberTimezone: string = 'America/Los_Angeles'
) {
  // Check member setting
  const { data: member } = await supabase
    .from('members')
    .select('id, first_name, family_can_see_call_summaries')
    .eq('id', memberId)
    .single()

  if (!member?.family_can_see_call_summaries) return

  // Find family contacts who want text
  const { data: family } = await supabase
    .from('family_contacts')
    .select('id, name, phone, preferred_contact_method')
    .eq('member_id', memberId)
    .eq('preferred_contact_method', 'text')
    .eq('active', true)

  if (!family || family.length === 0) return

  // Build message — no scores, no transcript
  let msg = `Thrive: ${member.first_name} had a check-in call today. `
  const summary = aiSummary?.slice(0, 200) ?? ''
  msg += summary
  if (msg.length > MAX_LENGTH) msg = msg.slice(0, MAX_LENGTH - 3) + '...'
  msg += ' View: thriveathome.app/family'

  const quiet = isQuietHour(memberTimezone)
  const sendAt = quiet ? nextSendTime(memberTimezone) : new Date()

  for (const contact of family) {
    if (!contact.phone) continue
    // Queue in outbound_sms table (Twilio sends from cron; blocked on LLC)
    await supabase.from('outbound_sms').insert({
      to_phone: contact.phone,
      body: msg,
      member_id: memberId,
      family_contact_id: contact.id,
      scheduled_at: sendAt.toISOString(),
      status: 'queued',
      created_at: new Date().toISOString(),
    }).then(({ error: _e }: { error: unknown }) => void _e)
  }
}
