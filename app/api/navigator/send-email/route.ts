import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getNavigatorByAuthId } from '@/lib/data/navigator'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailProvider } from '@/lib/providers'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: navigator, error: navError } = await getNavigatorByAuthId(user.id)
  if (navError || !navigator) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body?.subject?.trim()) return NextResponse.json({ error: 'subject is required' }, { status: 400 })
  if (!body?.message?.trim()) return NextResponse.json({ error: 'message is required' }, { status: 400 })

  const subject = String(body.subject).trim().slice(0, 200)
  const message = String(body.message).trim().slice(0, 5000)

  const admin = createAdminClient()

  // Get member IDs assigned to this navigator
  const { data: assignments } = await admin
    .from('navigator_assignments')
    .select('member_id')
    .eq('navigator_id', navigator.id)

  if (!assignments?.length) {
    return NextResponse.json({ sent: 0, message: 'No members in your caseload.' })
  }

  const memberIds = assignments.map((a: { member_id: string }) => a.member_id)

  // Get contact info from family_members linked to these members
  const { data: contacts } = await admin
    .from('family_members')
    .select('email, full_name')
    .in('member_id', memberIds)
    .not('email', 'is', null)

  if (!contacts?.length) {
    return NextResponse.json({ sent: 0, message: 'No email addresses on file for your caseload.' })
  }

  let sent = 0
  for (const contact of contacts) {
    if (!contact.email) continue
    try {
      await emailProvider.sendOrgNewsletter(contact.email, contact.full_name, 'ThriveAtHome Navigator', subject, message)
      sent++
    } catch { /* best-effort */ }
  }

  return NextResponse.json({ sent })
}
