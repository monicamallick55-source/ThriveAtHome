import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@thrivathome.com'

const SLA_HOURS: Record<string, number> = {
  member: 48, family: 48,
  'org-admin': 24, 'employer-admin': 24, 'agency-admin': 24,
  'network-admin': 24, 'senior-center-admin': 24, 'aaa-admin': 24,
  'vso-admin': 24, 'university-admin': 24, 'school-admin': 24,
  navigator: 8,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, subject, description, portal_type, priority = 'normal', org_id } = body
    if (!subject?.trim() || !description?.trim() || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const { createServerClient } = await import('@supabase/ssr')
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    let submitterEmail = user?.email ?? 'unknown@thrivathome.com'
    let submitterName = ''
    if (user?.id) {
      const admin = createAdminClient() as any
      const { data: member } = await admin.from('members').select('first_name, last_name, email').eq('supabase_auth_id', user.id).maybeSingle()
      if (member) { submitterEmail = member.email ?? submitterEmail; submitterName = `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() }
    }
    const sla_hours = SLA_HOURS[portal_type ?? 'member'] ?? 48
    const sla_breach_at = new Date(Date.now() + sla_hours * 3600000).toISOString()
    const admin = createAdminClient() as any
    const { data: ticket, error: dbError } = await admin.from('support_tickets').insert({
      submitted_by_auth_id: user?.id ?? null, submitter_email: submitterEmail,
      submitter_name: submitterName || null, org_id: org_id ?? null,
      subject, description, category, priority, portal_type: portal_type ?? 'member',
      sla_hours, sla_breach_at,
    }).select('id').single()
    if (dbError) console.error('support_tickets insert error:', dbError)
    const ticketId = ticket?.id?.slice(0, 8) ?? 'new'
    try {
      await resend.emails.send({
        from: 'ThriveAtHome Support <noreply@thrivathome.com>',
        to: SUPPORT_EMAIL,
        subject: `[${priority.toUpperCase()}] ${portal_type ?? 'member'} ticket: ${subject}`,
        html: `<h2>New Support Ticket #${ticketId}</h2><p><b>From:</b> ${submitterName || 'Unknown'} &lt;${submitterEmail}&gt;<br><b>Portal:</b> ${portal_type}<br><b>Category:</b> ${category}<br><b>Priority:</b> ${priority}<br><b>SLA:</b> respond by ${new Date(sla_breach_at).toLocaleString()}</p><hr><h3>${subject}</h3><p style="white-space:pre-wrap">${description}</p>`,
      })
    } catch (emailErr) { console.error('support ticket email failed:', emailErr) }
    return NextResponse.json({ ok: true, ticket_id: ticket?.id ?? null })
  } catch (err) {
    console.error('POST /api/support/ticket error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
