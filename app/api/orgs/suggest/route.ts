// FEATURE-008 — member couldn't find their village/org in search, wants it added to ThriveAtHome.
// Logs a pending org_suggestions row for staff to follow up and add the org.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

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

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const orgName = typeof body?.org_name === 'string' ? body.org_name.trim() : ''
  if (!orgName) return NextResponse.json({ error: 'Organization name is required.' }, { status: 400 })

  const city = typeof body?.city === 'string' ? body.city.trim().slice(0, 200) : null
  const zipCode = typeof body?.zip_code === 'string' ? body.zip_code.trim().slice(0, 20) : null
  const contactEmail = typeof body?.contact_email === 'string' ? body.contact_email.trim().slice(0, 320) : null

  const { memberId, name } = await resolveMember(user.id)

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from as any)('org_suggestions')
    .insert({
      member_id: memberId,
      submitted_by_auth: user.id,
      submitted_by_name: name,
      suggestion_type: 'add_request',
      org_name: orgName.slice(0, 300),
      city,
      zip_code: zipCode,
      contact_email: contactEmail,
      status: 'pending',
    })
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[api/orgs/suggest POST]', error)
    return NextResponse.json({ error: 'Could not submit your suggestion. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ suggestion: data }, { status: 201 })
}
