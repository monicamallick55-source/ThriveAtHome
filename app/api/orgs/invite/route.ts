// FEATURE-008 — member wants ThriveAtHome to introduce itself to their village/org.
// Sends an introduction email to the org's contact and logs it in org_suggestions.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailProvider } from '@/lib/providers'

async function resolveMember(authId: string): Promise<{ memberId: string | null; name: string | null }> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: direct } = await (admin.from as any)('members')
    .select('id, preferred_name, full_name').eq('supabase_auth_id', authId).maybeSingle()
  if (direct?.id) return { memberId: direct.id, name: direct.preferred_name ?? direct.full_name ?? null }
  const { data: fm } = await admin
    .from('family_members').select('member_id, full_name').eq('supabase_auth_id', authId).maybeSingle()
  return { memberId: fm?.member_id ?? null, name: fm?.full_name ?? null }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const orgName = typeof body?.org_name === 'string' ? body.org_name.trim() : ''
  const contactEmail = typeof body?.contact_email === 'string' ? body.contact_email.trim() : ''
  if (!orgName) return NextResponse.json({ error: 'Organization name is required.' }, { status: 400 })
  if (!contactEmail || !EMAIL_RE.test(contactEmail)) {
    return NextResponse.json({ error: 'A valid contact email is required to send the invitation.' }, { status: 400 })
  }

  const { memberId, name } = await resolveMember(user.id)
  const inviterName = name ?? 'A ThriveAtHome member'

  try {
    await emailProvider.sendOrgInvite(contactEmail, orgName.slice(0, 300), inviterName)
  } catch (e) {
    console.error('[api/orgs/invite] sendOrgInvite failed:', e)
    return NextResponse.json({ error: 'Could not send the invitation. Please try again.' }, { status: 500 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from as any)('org_suggestions')
    .insert({
      member_id: memberId,
      submitted_by_auth: user.id,
      submitted_by_name: name,
      suggestion_type: 'invite_sent',
      org_name: orgName.slice(0, 300),
      contact_email: contactEmail,
      status: 'pending',
    })
  if (error) console.error('[api/orgs/invite] failed to log suggestion:', error)

  return NextResponse.json({ ok: true }, { status: 201 })
}
