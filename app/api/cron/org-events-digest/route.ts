import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailProvider } from '@/lib/providers'

// Weekly Events Digest — fires every Monday at 8am (vercel.json: "0 8 * * 1")
// Sends a digest of upcoming org events this week to all active org members

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const weekStart = now.toISOString().slice(0, 10)
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // Get all active orgs
  const { data: orgs } = await (admin.from as any)('community_orgs')
    .select('id, org_name, contact_email')
    .eq('is_active', true) as { data: { id: string; org_name: string; contact_email: string | null }[] | null }

  if (!orgs?.length) return NextResponse.json({ processed: 0 })

  let totalDigestsSent = 0

  for (const org of orgs) {
    try {
      // Get upcoming events for this org (via org-linked circle_events and general events)
      const { data: events } = await (admin.from as any)('circle_events')
        .select('title, event_date, event_time, format, dial_in_number, dial_in_code')
        .gte('event_date', weekStart)
        .lte('event_date', weekEnd)
        .order('event_date', { ascending: true })
        .limit(10) as { data: { title: string; event_date: string; event_time: string | null; format: string; dial_in_number: string | null; dial_in_code: string | null }[] | null }

      if (!events?.length) continue

      // Get active members for this org
      const { data: memberships } = await (admin.from as any)('org_memberships')
        .select('member_id')
        .eq('org_id', org.id)
        .eq('is_active', true) as { data: { member_id: string }[] | null }

      if (!memberships?.length) continue

      const memberIds = memberships.map(m => m.member_id)
      const { data: contacts } = await admin
        .from('family_members')
        .select('email, full_name')
        .in('member_id', memberIds)

      if (!contacts?.length) continue

      // Format event list
      const eventLines = events.map(e => {
        const timeStr = e.event_time ? ` at ${e.event_time}` : ''
        const formatStr = e.format === 'phone_only' ? '📞 Phone'
          : e.format === 'in_person' ? '📍 In person'
          : '📱 Video/Phone'
        const dialIn = e.dial_in_number ? `\n   Call ${e.dial_in_number}${e.dial_in_code ? ` · Code: ${e.dial_in_code}` : ''}` : ''
        return `• ${e.title} — ${e.event_date}${timeStr} · ${formatStr}${dialIn}`
      }).join('\n\n')

      const subject = `This Week at ${org.org_name} — Events & Activities`
      const message = `Dear Neighbor,

Here are the upcoming events and activities at ${org.org_name} this week:

${eventLines}

We hope to see you there! If you have any questions, please reach out to your org coordinator.

Warm regards,
${org.org_name} Village Network`

      let sent = 0
      for (const contact of contacts) {
        if (!contact.email) continue
        try {
          await emailProvider.sendOrgNewsletter(contact.email, contact.full_name, org.org_name, subject, message)
          sent++
        } catch { /* best-effort */ }
      }

      if (sent > 0) {
        // Log to org_sent_emails
        await (admin.from as any)('org_sent_emails').insert({
          org_id: org.id,
          subject,
          body: message,
          recipient_group: 'weekly_events_digest',
          recipient_count: sent,
          sent_by_name: 'ThriveAtHome (automated)',
        })
        totalDigestsSent++
      }
    } catch (err) {
      console.error(`[org-events-digest] Error for org ${org.id}:`, err)
    }
  }

  console.log(`[org-events-digest] Sent digests for ${totalDigestsSent} orgs`)
  return NextResponse.json({ processed: totalDigestsSent })
}
