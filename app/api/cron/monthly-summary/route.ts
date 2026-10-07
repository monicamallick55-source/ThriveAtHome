import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aiProvider, emailProvider } from '@/lib/providers'
import type { Member as AiMember, CheckInCall as AiCheckInCall } from '@/lib/interfaces/AiProvider'

export const runtime = 'nodejs'

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

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: members, error: membersError } = await admin
    .from('members')
    .select('*')
    .eq('status', 'active')

  if (membersError) {
    console.error('[monthly-summary] Failed to fetch members:', membersError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const results = { sent: 0, skipped: 0, errors: 0 }

  for (const member of members ?? []) {
    try {
      const { data: calls } = await admin
        .from('check_in_calls')
        .select('*')
        .eq('member_id', member.id)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })

      const { data: familyMembers } = await admin
        .from('family_members')
        .select('email, full_name, notification_prefs')
        .eq('member_id', member.id)

      const emailRecipients = (familyMembers ?? []).filter(
        (fm) => (fm.notification_prefs as { email: boolean })?.email !== false
      )

      if (emailRecipients.length === 0) {
        results.skipped++
        continue
      }

      const summaryContent = await aiProvider.generateMonthlySummary(
        toAiMember(member as unknown as Record<string, unknown>),
        (calls ?? []).map((c: any) => toAiCall(c as unknown as Record<string, unknown>))
      )

      await Promise.allSettled(
        emailRecipients.map((fm: any) =>
          emailProvider.sendMonthlySummary(fm.email, member.preferred_name, summaryContent)
        )
      )

      results.sent++
    } catch (e) {
      console.error(`[monthly-summary] Error processing member ${member.id}:`, e)
      results.errors++
    }
  }

  console.log('[monthly-summary] Complete:', results)
  return NextResponse.json({ success: true, ...results })
}
