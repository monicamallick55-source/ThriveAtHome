// app/api/cron/ml-analytics/route.ts
// Computes weekly member health scores and wellbeing signals for navigator dashboard
// Schedule: weekly Sundays at 2:00 AM — { "path": "/api/cron/ml-analytics", "schedule": "0 9 * * 0" }
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

interface MemberSignals {
  memberId: string
  missedCallsLast7: number
  serviceBookingsLast30: number
  communityEventsLast30: number
  messagesLast7: number
  daysActiveLast30: number
}

function computeWellbeingScore(signals: MemberSignals): { score: number; risk: RiskLevel; flags: string[] } {
  const flags: string[] = []
  let score = 100

  // Missed check-ins (biggest signal)
  if (signals.missedCallsLast7 >= 5) { score -= 40; flags.push('missed_5+_checkins') }
  else if (signals.missedCallsLast7 >= 3) { score -= 25; flags.push('missed_3+_checkins') }
  else if (signals.missedCallsLast7 >= 1) { score -= 10; flags.push('missed_checkin') }

  // Social isolation signals
  if (signals.communityEventsLast30 === 0 && signals.messagesLast7 === 0) {
    score -= 20; flags.push('social_isolation_risk')
  } else if (signals.communityEventsLast30 === 0) {
    score -= 8; flags.push('no_community_engagement')
  }

  // Low service utilisation (Complete tier members not using services)
  if (signals.serviceBookingsLast30 === 0) {
    score -= 5; flags.push('no_service_bookings')
  }

  // Inactivity
  if (signals.daysActiveLast30 < 5) { score -= 15; flags.push('very_low_platform_activity') }
  else if (signals.daysActiveLast30 < 10) { score -= 8; flags.push('low_platform_activity') }

  score = Math.max(0, Math.min(100, score))

  let risk: RiskLevel
  if (score < 40) risk = 'critical'
  else if (score < 60) risk = 'high'
  else if (score < 75) risk = 'medium'
  else risk = 'low'

  return { score, risk, flags }
}

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseAdmin as any
  const now = new Date()
  const ago7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString()
  const ago30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const weekStart = now.toISOString().slice(0, 10)

  const { data: members, error } = await db
    .from('members')
    .select('id, first_name, last_name, plan, subscription_status')
    .eq('subscription_status', 'active')

  if (error) {
    console.error('[ml-analytics] Members error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  let processed = 0, highRisk = 0, critical = 0

  for (const member of (members || [])) {
    try {
      // Parallel signal fetching
      const [missedCalls, serviceBookings, communityEvents, messages] = await Promise.all([
        db.from('call_logs')
          .select('id', { count: 'exact', head: true })
          .eq('member_id', member.id)
          .eq('call_type', 'aria_checkin')
          .in('status', ['no_answer', 'failed', 'busy'])
          .gte('created_at', ago7),
        db.from('service_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('member_id', member.id)
          .gte('created_at', ago30),
        db.from('event_registrations')
          .select('id', { count: 'exact', head: true })
          .eq('member_id', member.id)
          .gte('created_at', ago30),
        db.from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('sender_member_id', member.id)
          .gte('created_at', ago7),
      ])

      const signals: MemberSignals = {
        memberId: member.id,
        missedCallsLast7: missedCalls.count ?? 0,
        serviceBookingsLast30: serviceBookings.count ?? 0,
        communityEventsLast30: communityEvents.count ?? 0,
        messagesLast7: messages.count ?? 0,
        daysActiveLast30: Math.max(serviceBookings.count ?? 0, communityEvents.count ?? 0, messages.count ?? 0),
      }

      const { score, risk, flags } = computeWellbeingScore(signals)

      // Upsert weekly analytics record
      await db.from('member_wellbeing_scores').upsert({
        member_id: member.id,
        week_of: weekStart,
        wellbeing_score: score,
        risk_level: risk,
        flags,
        signals,
        computed_at: now.toISOString(),
      }, { onConflict: 'member_id,week_of' })

      // Create navigator task for high-risk members
      if (risk === 'critical' || risk === 'high') {
        await db.from('navigator_tasks').insert({
          member_id: member.id,
          task_type: 'wellbeing_alert',
          description: `Wellbeing score: ${score}/100 (${risk.toUpperCase()}). Flags: ${flags.join(', ')}. Review member activity and check in proactively.`,
          priority: risk === 'critical' ? 'critical' : 'high',
        })

        if (risk === 'critical') critical++
        else highRisk++
      }

      processed++
    } catch (err) {
      console.error(`[ml-analytics] Error processing member ${member.id}:`, err)
    }
  }

  return NextResponse.json({ processed, high_risk: highRisk, critical })
}

export async function GET(req: NextRequest) { return POST(req) }
