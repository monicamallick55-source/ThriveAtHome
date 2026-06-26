import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrgDonations, createOrgDonation } from '@/lib/data/communityOrgs'

const VALID_PAYMENT_METHODS = ['cash', 'check', 'card', 'online', 'in_kind']

async function getOrgAdminContext(userId: string) {
  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, org_id').eq('supabase_auth_id', userId).maybeSingle()
  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) return null
  if (!fm.org_id) return null
  return fm as { role: string; org_id: string }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fm = await getOrgAdminContext(user.id)
  if (!fm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await getOrgDonations(fm.org_id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fm = await getOrgAdminContext(user.id)
  if (!fm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body?.donor_name?.trim()) return NextResponse.json({ error: 'donor_name is required' }, { status: 400 })
  if (typeof body.amount_cents !== 'number' || body.amount_cents < 0) {
    return NextResponse.json({ error: 'amount_cents must be a non-negative number' }, { status: 400 })
  }
  if (!body.donation_date) return NextResponse.json({ error: 'donation_date is required' }, { status: 400 })

  const paymentMethod = VALID_PAYMENT_METHODS.includes(body.payment_method) ? body.payment_method : 'cash'

  const { data, error } = await createOrgDonation(fm.org_id, {
    donor_name: body.donor_name.trim(),
    donor_email: body.donor_email?.trim() || null,
    amount_cents: body.amount_cents,
    donation_date: body.donation_date,
    payment_method: paymentMethod,
    notes: body.notes?.trim() || null,
    is_anonymous: body.is_anonymous === true,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
