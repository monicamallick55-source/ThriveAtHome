import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailProvider } from '@/lib/providers'

const CARE_TEAM_EMAIL = process.env.CARE_TEAM_EMAIL ?? 'care@thriveathome.com'

export async function POST(req: NextRequest) {
  let body: { full_name?: string; email?: string; linkedin_url?: string; why_interested?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const full_name = body.full_name?.trim()
  const email = body.email?.trim()
  const linkedin_url = body.linkedin_url?.trim() || null
  const why_interested = body.why_interested?.trim()

  if (!full_name || !email || !why_interested) {
    return NextResponse.json({ error: 'Name, email, and why you\'re interested are required.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await (admin.from as any)('navigator_applications')
    .insert({ full_name, email, linkedin_url, why_interested, status: 'pending' })
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[api/careers/navigator/apply] insert failed:', error)
    return NextResponse.json({ error: 'Could not submit your application. Please try again.' }, { status: 500 })
  }

  try {
    await emailProvider.sendOrgNewsletter(
      CARE_TEAM_EMAIL,
      'Care Team',
      'ThriveAtHome',
      `New Care Navigator application from ${full_name}`,
      `Name: ${full_name}\nEmail: ${email}\nLinkedIn: ${linkedin_url ?? 'not provided'}\n\nWhy interested:\n${why_interested}`
    )
  } catch (err) {
    console.error('[api/careers/navigator/apply] notification email failed:', err)
  }

  return NextResponse.json({ success: true, id: data?.id })
}
