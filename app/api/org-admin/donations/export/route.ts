import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrgDonations } from '@/lib/data/communityOrgs'

async function getOrgAdminContext(userId: string) {
  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, org_id').eq('supabase_auth_id', userId).maybeSingle()
  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) return null
  if (!fm.org_id) return null
  return fm as { role: string; org_id: string }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fm = await getOrgAdminContext(user.id)
  if (!fm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: donations, error } = await getOrgDonations(fm.org_id, 1000)
  if (error) return NextResponse.json({ error }, { status: 500 })

  const rows = [
    ['Donor Name', 'Email', 'Amount', 'Date', 'Payment Method', 'Anonymous', 'Receipt Sent', 'Notes'],
    ...(donations ?? []).map((d: any) => [
      d.is_anonymous ? 'Anonymous' : d.donor_name,
      d.is_anonymous ? '' : (d.donor_email ?? ''),
      `$${(d.amount_cents / 100).toFixed(2)}`,
      d.donation_date,
      d.payment_method,
      d.is_anonymous ? 'Yes' : 'No',
      'N/A',
      d.notes ?? '',
    ]),
  ]

  const csv = rows.map((row: any) =>
    row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="donations-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
