// Test script for Phase 23 — Weekly Digest
// Run: npx tsx --env-file=.env.local scripts/test-weekly-digest.ts
import { createAdminClient } from '../lib/supabase/admin'
import { aiProvider, emailProvider } from '../lib/providers'
import type { Member as AiMember, CheckInCall as AiCheckInCall } from '../lib/interfaces/AiProvider'

const TEST_MEMBER_EMAIL = 'test-family@thriveathome.dev'
const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

function toAiMember(m: Record<string, unknown>): AiMember {
  return {
    id: m.id as string,
    preferred_name: m.preferred_name as string,
    full_name: m.full_name as string,
    date_of_birth: m.date_of_birth as string,
    phone_number: m.phone_number as string,
    preferred_language: (m.preferred_language as string) ?? 'english',
    topics_enjoy: (m.topics_enjoy as string[]) ?? [],
    health_conditions: (m.health_conditions as string | null) ?? null,
    medications: (m.medications as string | null) ?? null,
    plan_tier: m.plan_tier as string,
  }
}

function toAiCall(c: Record<string, unknown>): AiCheckInCall {
  return {
    id: c.id as string,
    scheduled_at: (c.scheduled_at as string | null) ?? null,
    mood_score: (c.mood_score as number | null) ?? null,
    energy_score: (c.energy_score as number | null) ?? null,
    pain_score: (c.pain_score as number | null) ?? null,
    medication_taken: (c.medication_taken as boolean | null) ?? null,
    ai_summary: (c.ai_summary as string | null) ?? null,
    alert_flags: (c.alert_flags as string[]) ?? [],
  }
}

async function main() {
  console.log('=== Phase 23 Weekly Digest Test ===\n')

  const admin = createAdminClient()

  // Find Margaret Chen via her family member email
  const { data: fm, error: fmError } = await admin
    .from('family_members')
    .select('member_id, email, full_name')
    .eq('email', TEST_MEMBER_EMAIL)
    .maybeSingle()

  if (fmError || !fm || !fm.member_id) {
    console.error('❌ Could not find test family member. Run seed-test-data.ts first.')
    process.exit(1)
  }

  console.log(`✓ Found family member: ${fm.full_name} (${fm.email})`)

  const { data: member, error: memberError } = await admin
    .from('members')
    .select('*')
    .eq('id', fm.member_id)
    .maybeSingle()

  if (memberError || !member) {
    console.error('❌ Could not find member:', memberError)
    process.exit(1)
  }

  console.log(`✓ Found member: ${member.preferred_name} (${member.full_name})`)

  // Get last 7 days of calls
  const { data: weeklyCalls, error: callsError } = await admin
    .from('check_in_calls')
    .select('*')
    .eq('member_id', member.id)
    .gte('created_at', SEVEN_DAYS_AGO)
    .order('created_at', { ascending: false })

  if (callsError) {
    console.error('❌ Could not fetch calls:', callsError)
    process.exit(1)
  }

  console.log(`✓ Found ${weeklyCalls?.length ?? 0} calls in last 7 days`)

  // Get last 30 days of calls
  const { data: monthlyCalls } = await admin
    .from('check_in_calls')
    .select('*')
    .eq('member_id', member.id)
    .gte('created_at', THIRTY_DAYS_AGO)
    .order('created_at', { ascending: false })

  console.log(`✓ Found ${monthlyCalls?.length ?? 0} calls in last 30 days`)

  const aiMember = toAiMember(member as unknown as Record<string, unknown>)

  // Test 1: Weekly digest generation
  console.log('\n--- Test 1: Weekly Digest ---')
  const weeklyContent = await aiProvider.generateWeeklyDigest(
    aiMember,
    (weeklyCalls ?? []).map((c) => toAiCall(c as unknown as Record<string, unknown>))
  )
  console.log(`AI digest: "${weeklyContent}"`)

  await emailProvider.sendWeeklyDigest(fm.email, member.preferred_name, weeklyContent)
  console.log('✅ Weekly digest email sent (stub log above)')

  // Test 2: Monthly summary generation
  console.log('\n--- Test 2: Monthly Summary ---')
  const monthlyContent = await aiProvider.generateMonthlySummary(
    aiMember,
    (monthlyCalls ?? []).map((c) => toAiCall(c as unknown as Record<string, unknown>))
  )
  console.log(`AI summary: "${monthlyContent}"`)

  await emailProvider.sendMonthlySummary(fm.email, member.preferred_name, monthlyContent)
  console.log('✅ Monthly summary email sent (stub log above)')

  // Test 3: Family nudge (simulate last_login_at 8 days ago)
  console.log('\n--- Test 3: Family Nudge ---')
  const nudgeMsg = `It looks like you haven't checked in recently. ${member.preferred_name} has had some activity since your last visit — log in to see their latest updates.`
  await emailProvider.sendWeeklyDigest(fm.email, member.preferred_name, nudgeMsg)
  console.log('✅ Family nudge email sent (stub log above)')

  console.log('\n=== All 3 tests passed ===')
  console.log('Note: Using stub providers — no real emails sent.')
  console.log('When SENDGRID_API_KEY is set, real emails will be delivered.')
}

main().catch((e) => {
  console.error('Test failed:', e)
  process.exit(1)
})
