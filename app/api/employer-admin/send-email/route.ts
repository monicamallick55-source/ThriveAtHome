import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailProvider } from '@/lib/providers'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('id, full_name, employer_account_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm || (fm.role !== 'employer_admin' && fm.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!fm.employer_account_id) {
    return NextResponse.json({ error: 'No employer account linked' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.subject?.trim()) return NextResponse.json({ error: 'subject is required' }, { status: 400 })
  if (!body?.message?.trim()) return NextResponse.json({ error: 'message is required' }, { status: 400 })

  const subject = String(body.subject).trim().slice(0, 200)
  const message = String(body.message).trim().slice(0, 5000)

  // Get company name
  type EmployerRow = { company_name: string }
  const { data: account } = await admin
    .from('employer_accounts')
    .select('company_name')
    .eq('id', fm.employer_account_id)
    .maybeSingle() as unknown as { data: EmployerRow | null; error: unknown }
  const companyName = account?.company_name ?? 'Your Employer'

  // Get enrolled employees (role=family members with this employer_account_id)
  const { data: employees } = await admin
    .from('family_members')
    .select('email, full_name')
    .eq('employer_account_id', fm.employer_account_id)
    .eq('role', 'family')

  if (!employees?.length) {
    return NextResponse.json({ sent: 0, message: 'No enrolled employees to email.' })
  }

  let sent = 0
  for (const emp of employees) {
    if (!emp.email) continue
    try {
      await emailProvider.sendOrgNewsletter(emp.email, emp.full_name, companyName, subject, message)
      sent++
    } catch { /* best-effort */ }
  }

  return NextResponse.json({ sent })
}
