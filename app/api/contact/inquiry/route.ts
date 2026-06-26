import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailProvider } from '@/lib/providers'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.name?.trim() || !body?.email?.trim()) {
    return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
  }

  const name = String(body.name).trim().slice(0, 200)
  const email = String(body.email).trim().slice(0, 200)
  const message = String(body.message ?? '').trim().slice(0, 2000)
  const source = String(body.source ?? 'website').trim().slice(0, 100)
  const orgName = String(body.org_name ?? 'ThriveAtHome').trim().slice(0, 200)

  const admin = createAdminClient()

  // Log the inquiry to employer_leads table (reuse existing table for all inquiries)
  try {
    await admin.from('employer_leads').insert({
      company_name: orgName,
      contact_name: name,
      email,
      notes: `Source: ${source}. Message: ${message}`,
      status: 'new',
    })
  } catch { /* best-effort */ }

  // Best-effort: send notification email (stub logs to console)
  try {
    await emailProvider.sendOrgNewsletter(
      'navigator@thriveathome.dev',
      'Navigator',
      orgName,
      `New inquiry from ${name} via ${source}`,
      `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    )
  } catch { /* stub logs to console */ }

  return NextResponse.json({ success: true })
}
