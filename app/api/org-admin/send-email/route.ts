import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailProvider } from '@/lib/providers'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('id, role, org_id, full_name').eq('supabase_auth_id', user.id).maybeSingle()
  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!fm.org_id) return NextResponse.json({ error: 'No org linked to your account' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body?.subject?.trim()) return NextResponse.json({ error: 'subject is required' }, { status: 400 })
  if (!body?.message?.trim()) return NextResponse.json({ error: 'message is required' }, { status: 400 })

  const subject = String(body.subject).trim().slice(0, 200)
  const message = String(body.message).trim().slice(0, 5000)
  const recipientGroup = String(body.recipient_group ?? 'all')

  const { data: org } = await (admin.from as any)('community_orgs').select('org_name').eq('id', fm.org_id).maybeSingle()
  const orgName = (org as { org_name: string } | null)?.org_name ?? 'Your Village'

  // Get active member_ids in this org based on recipient_group
  let membershipQuery = (admin.from as any)('org_memberships')
    .select('member_id')
    .eq('org_id', fm.org_id)
    .eq('is_active', true)

  if (recipientGroup === 'dues_due') {
    // Members who haven't paid dues this calendar year
    const currentYear = new Date().getFullYear()
    const { data: paidIds } = await (admin.from as any)('org_memberships')
      .select('member_id')
      .eq('org_id', fm.org_id)
      .gte('dues_paid_date', `${currentYear}-01-01`)
    const paidSet = new Set(((paidIds ?? []) as { member_id: string }[]).map(m => m.member_id))
    const { data: allMemberships } = await membershipQuery
    const dueIds = ((allMemberships ?? []) as { member_id: string }[])
      .filter(m => !paidSet.has(m.member_id))
      .map(m => m.member_id)
    if (!dueIds.length) return NextResponse.json({ sent: 0, message: 'No members with dues due.' })

    const { data: contacts } = await admin.from('family_members').select('email, full_name').in('member_id', dueIds)
    const sent = await sendToContacts(contacts ?? [], orgName, subject, message)
    const logged = await logSentEmail(admin, fm.org_id, subject, message, recipientGroup, sent, fm.full_name)
    return NextResponse.json({ sent, logged })
  }

  if (recipientGroup.startsWith('member_')) {
    // Individual member email
    const targetMemberId = recipientGroup.replace('member_', '')
    const { data: contacts } = await admin.from('family_members').select('email, full_name').eq('member_id', targetMemberId)
    const sent = await sendToContacts(contacts ?? [], orgName, subject, message)
    const logged = await logSentEmail(admin, fm.org_id, subject, message, recipientGroup, sent, fm.full_name)
    return NextResponse.json({ sent, logged })
  }

  if (recipientGroup === 'volunteers') {
    // All active volunteers linked to this org (via volunteers table or family_members with role='volunteer')
    const { data: volFMs } = await admin.from('family_members').select('email, full_name').eq('org_id', fm.org_id).eq('role', 'volunteer')
    const sent = await sendToContacts(volFMs ?? [], orgName, subject, message)
    const logged = await logSentEmail(admin, fm.org_id, subject, message, recipientGroup, sent, fm.full_name)
    return NextResponse.json({ sent, logged })
  }

  if (recipientGroup === 'donors') {
    // All donors who donated to this org
    const { data: donorRows } = await (admin.from as any)('org_donations')
      .select('donor_email, donor_name')
      .eq('org_id', fm.org_id)
      .eq('is_anonymous', false)
      .not('donor_email', 'is', null) as { data: { donor_email: string; donor_name: string }[] | null }
    const uniqueDonors = Array.from(new Map((donorRows ?? []).map(d => [d.donor_email, d])).values())
    const donorContacts = uniqueDonors.map(d => ({ email: d.donor_email, full_name: d.donor_name }))
    const sent = await sendToContacts(donorContacts, orgName, subject, message)
    const logged = await logSentEmail(admin, fm.org_id, subject, message, recipientGroup, sent, fm.full_name)
    return NextResponse.json({ sent, logged })
  }

  if (recipientGroup.startsWith('program_')) {
    // Members enrolled in a specific program — fall through to all members for now
    // Will be refined when program_members link table is added
  }

  // Default: all active members
  const { data: memberships } = await membershipQuery
  if (!memberships?.length) {
    return NextResponse.json({ sent: 0, message: 'No active members to send to.' })
  }
  const memberIds = (memberships as { member_id: string }[]).map(m => m.member_id)
  const { data: contacts } = await admin.from('family_members').select('email, full_name').in('member_id', memberIds)

  const sent = await sendToContacts(contacts ?? [], orgName, subject, message)
  const logged = await logSentEmail(admin, fm.org_id, subject, message, recipientGroup, sent, fm.full_name)
  return NextResponse.json({ sent, logged })
}

async function sendToContacts(
  contacts: { email: string; full_name: string }[],
  orgName: string,
  subject: string,
  message: string
): Promise<number> {
  let sent = 0
  for (const contact of contacts) {
    if (!contact.email) continue
    try {
      await emailProvider.sendOrgNewsletter(contact.email, contact.full_name, orgName, subject, message)
      sent++
    } catch {
      // best-effort
    }
  }
  return sent
}

async function logSentEmail(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
  subject: string,
  body: string,
  recipientGroup: string,
  recipientCount: number,
  sentByName: string | null
) {
  const { data } = await (admin.from as any)('org_sent_emails').insert({
    org_id: orgId,
    subject,
    body,
    recipient_group: recipientGroup,
    recipient_count: recipientCount,
    sent_by_name: sentByName,
  }).select().maybeSingle()
  return data
}
