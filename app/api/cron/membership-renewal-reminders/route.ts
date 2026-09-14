// Daily cron — emails community-org members 30, 14 and 7 days before their annual
// dues lapse (dues_paid_date + 1 year). Matches Helpful Village renewal reminders.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailProvider } from '@/lib/providers'

export const runtime = 'nodejs'

const BUCKETS = [30, 14, 7]

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const admin = createAdminClient()
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const { data: memberships, error } = await (admin.from as any)('org_memberships')
    .select('id, member_id, org_id, dues_paid_date, is_active, last_renewal_reminder_sent, annual_dues_paid_cents')
    .eq('is_active', true)
    .not('dues_paid_date', 'is', null)

  if (error) {
    console.error('[cron/membership-renewal-reminders]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = { checked: 0, reminded: 0, skipped: 0 }

  for (const m of memberships ?? []) {
    results.checked++
    const paid = new Date(m.dues_paid_date + 'T00:00:00Z')
    const expiry = new Date(paid)
    expiry.setUTCFullYear(expiry.getUTCFullYear() + 1)
    const daysLeft = Math.round((expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

    const bucket = BUCKETS.find(b => b === daysLeft)
    if (!bucket) { results.skipped++; continue }
    if (m.last_renewal_reminder_sent === bucket) { results.skipped++; continue }

    // Resolve org name + a contact email for the member (first linked family member).
    const [{ data: org }, { data: fm }] = await Promise.all([
      (admin.from as any)('community_orgs').select('org_name').eq('id', m.org_id).maybeSingle(),
      admin.from('family_members').select('email, full_name').eq('member_id', m.member_id).not('email', 'is', null).limit(1).maybeSingle(),
    ])
    const orgName = org?.org_name ?? 'your community organization'
    const to = fm?.email ?? process.env.CARE_TEAM_EMAIL ?? 'care-team@thriveathome.dev'
    const duesDollars = ((m.annual_dues_paid_cents ?? 0) / 100).toFixed(0)

    try {
      await emailProvider.sendWeeklyDigest(
        to,
        fm?.full_name ?? 'ThriveAtHome member',
        `Membership renewal reminder — your ${orgName} membership renews in ${bucket} days ` +
          `(on ${expiry.toISOString().slice(0, 10)}). Last year's dues were $${duesDollars}. ` +
          `Renew from your member portal → My Org.`
      )
      console.log(`[STUB][Email] Renewal reminder (${bucket}d) sent to ${to} for ${orgName}`)
    } catch (e) {
      console.warn('[cron/membership-renewal-reminders] email stub failed:', e)
    }

    await (admin.from as any)('org_memberships')
      .update({ last_renewal_reminder_sent: bucket, last_renewal_reminder_at: new Date().toISOString() })
      .eq('id', m.id)
    results.reminded++
  }

  return NextResponse.json({ ok: true, ...results })
}
