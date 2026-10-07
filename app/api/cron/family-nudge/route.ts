import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailProvider } from '@/lib/providers'

export const runtime = 'nodejs'

const NUDGE_WINDOW_DAYS = 7
const DEDUP_WINDOW_HOURS = 168 // 7 days

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const nudgeThreshold = new Date(Date.now() - NUDGE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const dedupThreshold = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000).toISOString()

  const { data: inactiveFamilyMembers, error } = await admin
    .from('family_members')
    .select('id, email, full_name, member_id, notification_prefs, last_login_at')
    .or(`last_login_at.is.null,last_login_at.lt.${nudgeThreshold}`)
    .not('member_id', 'is', null)

  if (error) {
    console.error('[family-nudge] Failed to fetch family members:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const results = { sent: 0, skipped_dedup: 0, skipped_no_alerts: 0, errors: 0 }

  for (const fm of inactiveFamilyMembers ?? []) {
    try {
      if ((fm.notification_prefs as { email: boolean })?.email === false) continue

      // Only nudge if member has unacknowledged alerts
      const { data: alerts } = await admin
        .from('alerts')
        .select('id')
        .eq('member_id', fm.member_id as string)
        .eq('acknowledged', false)
        .limit(1)

      if (!alerts || alerts.length === 0) {
        results.skipped_no_alerts++
        continue
      }

      // 7-day dedup: check notification_log for recent family_nudge
      const { data: recentNudge } = await admin
        .from('realtime_notifications')
        .select('id')
        .eq('member_id', fm.member_id as string)
        .eq('type', 'family_nudge')
        .gte('created_at', dedupThreshold)
        .limit(1)

      if (recentNudge && recentNudge.length > 0) {
        results.skipped_dedup++
        continue
      }

      const { data: member } = await admin
        .from('members')
        .select('preferred_name, full_name')
        .eq('id', fm.member_id as string)
        .maybeSingle()

      const memberName = member?.preferred_name ?? member?.full_name ?? 'your loved one'

      await emailProvider.sendWeeklyDigest(
        fm.email,
        memberName,
        `It looks like you haven't checked in recently. ${memberName} has had some activity since your last visit — log in to see their latest updates.`
      )

      // Record the nudge to enable dedup
      await (admin as any).from('realtime_notifications').insert({
        member_id: fm.member_id as string,
        type: 'family_nudge',
        severity: 'info',
        title: 'Family nudge sent',
        body: `Email nudge sent to ${fm.email}`,
      })

      results.sent++
    } catch (e) {
      console.error(`[family-nudge] Error processing family member ${fm.id}:`, e)
      results.errors++
    }
  }

  console.log('[family-nudge] Complete:', results)
  return NextResponse.json({ success: true, ...results })
}
