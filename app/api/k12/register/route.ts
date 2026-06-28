// Phase 86 — K-12 school registration API
import { NextRequest, NextResponse } from 'next/server'
import { registerK12School } from '@/lib/data/m21Volunteers'
import { emailProvider } from '@/lib/providers'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const schoolName = (body.school_name as string)?.trim()
  const contactName = (body.contact_name as string)?.trim()
  const contactEmail = (body.contact_email as string)?.trim()

  if (!schoolName || !contactName || !contactEmail) {
    return NextResponse.json({ error: 'school_name, contact_name, and contact_email are required' }, { status: 400 })
  }

  const { data, error } = await registerK12School({
    school_name: schoolName,
    contact_name: contactName,
    contact_email: contactEmail,
    school_type: (body.school_type as string) ?? 'high_school',
    city: (body.city as string) ?? null,
    state: (body.state as string) ?? null,
    grade_levels: (body.grade_levels as string[]) ?? [],
    program_types: (body.program_types as string[]) ?? [],
  })

  if (error) return NextResponse.json({ error }, { status: 500 })

  // Notify care team — best-effort
  void emailProvider.sendOrgNewsletter(
    process.env.CARE_TEAM_EMAIL ?? 'care@thriveathome.dev',
    'Care Team',
    'ThriveAtHome',
    `[K-12] New school registration: ${schoolName}`,
    `School: ${schoolName}\nType: ${body.school_type}\nContact: ${contactName} <${contactEmail}>\nCity: ${body.city ?? ''}, ${body.state ?? ''}\nPrograms: ${((body.program_types as string[]) ?? []).join(', ')}`
  ).catch(() => {})

  return NextResponse.json({ data })
}
