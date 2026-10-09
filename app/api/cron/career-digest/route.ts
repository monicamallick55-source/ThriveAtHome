// app/api/cron/career-digest/route.ts
// Weekly cron: send career opportunity digest to opted-in members with profiles

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const weekOf = new Date()
  weekOf.setDate(weekOf.getDate() - weekOf.getDay()) // Sunday of this week
  const weekOfStr = weekOf.toISOString().split('T')[0]

  // Load all active opportunities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opportunities } = await (admin as any)
    .from('career_opportunities')
    .select('id, title, organization, work_type, location, pay, remote_ok, skills_desired, industries, apply_url, apply_email, closes_on')
    .eq('status', 'active')

  if (!opportunities?.length) {
    return NextResponse.json({ sent: 0, reason: 'No active opportunities' })
  }

  // Load opted-in profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (admin as any)
    .from('career_profiles')
    .select('id, member_id, skills, industries, work_types, remote_ok, in_person_ok, member:members(id, full_name, preferred_name)')
    .eq('active', true)
    .eq('digest_opted_in', true)

  if (!profiles?.length) {
    return NextResponse.json({ sent: 0, reason: 'No opted-in profiles' })
  }

  let sent = 0

  for (const profile of profiles) {
    // Check if already sent this week
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (admin as any)
      .from('career_digest_log')
      .select('id')
      .eq('member_id', profile.member_id)
      .eq('week_of', weekOfStr)
      .maybeSingle()

    if (existing) continue

    // Score/match opportunities to this profile
    const matched = opportunities.filter((opp: Record<string, unknown>) => {
      // Remote/in-person filter
      if (opp.remote_ok && !profile.remote_ok) return false
      if (!opp.remote_ok && !profile.in_person_ok) return false

      // Work type filter
      if (profile.work_types?.length && !profile.work_types.includes(opp.work_type)) return false

      return true
    }).slice(0, 5) // max 5 per digest

    if (!matched.length) continue

    const oppIds = matched.map((o: Record<string, unknown>) => o.id)
    const name = (profile.member as Record<string, string>)?.preferred_name
      ?? (profile.member as Record<string, string>)?.full_name
      ?? 'Member'

    // Build digest text (in production this would go through an email service)
    const lines = matched.map((o: Record<string, unknown>) =>
      `• ${o.title} at ${o.organization} (${String(o.work_type).replace('_', ' ')})${o.location ? ` — ${o.location}` : ''}${o.pay ? ` · ${o.pay}` : ''}`
    ).join('\n')

    console.log(`[career-digest] Sending to ${name}:\n${lines}`)

    // Log the send
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('career_digest_log')
      .insert({
        member_id: profile.member_id,
        opportunity_ids: oppIds,
        week_of: weekOfStr,
      })

    // Create a navigator task / notification
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('realtime_notifications')
      .insert({
        member_id: profile.member_id,
        type: 'career_digest',
        title: `${matched.length} new career ${matched.length === 1 ? 'opportunity' : 'opportunities'} for you`,
        body: lines,
        read: false,
      })

    sent++
  }

  return NextResponse.json({ sent, week_of: weekOfStr, total_opportunities: opportunities.length })
}
