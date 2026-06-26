import { NextRequest, NextResponse } from 'next/server'
import { getAgencyForAdmin } from '@/lib/data/agencies'
import { getMembersForAgency } from '@/lib/data/agencies'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailProvider } from '@/lib/providers'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agency, error: agencyErr } = await getAgencyForAdmin(user.id)
  if (agencyErr || !agency) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body?.subject?.trim()) return NextResponse.json({ error: 'subject is required' }, { status: 400 })
  if (!body?.message?.trim()) return NextResponse.json({ error: 'message is required' }, { status: 400 })

  const subject = String(body.subject).trim().slice(0, 200)
  const message = String(body.message).trim().slice(0, 5000)

  // Get member IDs served by this agency
  const { data: members } = await getMembersForAgency(agency.id)
  if (!members?.length) {
    return NextResponse.json({ sent: 0, message: 'No care clients found.' })
  }

  const memberIds = members.map(m => m.id)

  // Get contact info from family_members (primary contact / family liaison)
  const admin = createAdminClient()
  const { data: contacts } = await admin
    .from('family_members')
    .select('email, full_name')
    .in('member_id', memberIds)
    .not('email', 'is', null)

  if (!contacts?.length) {
    return NextResponse.json({ sent: 0, message: 'No email addresses on file for care clients.' })
  }

  let sent = 0
  for (const contact of contacts) {
    if (!contact.email) continue
    try {
      await emailProvider.sendOrgNewsletter(contact.email, contact.full_name, agency.name, subject, message)
      sent++
    } catch { /* best-effort */ }
  }

  return NextResponse.json({ sent })
}
