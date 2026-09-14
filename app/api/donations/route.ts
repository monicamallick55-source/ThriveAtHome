import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Impact statements shown on the donation receipt + past-donation history.
// Keyed by the minimum dollar amount the tier applies to.
export const DONATION_IMPACT_TIERS: { min: number; statement: string }[] = [
  { min: 150, statement: 'Supports a full month of navigator care coordination for a senior in need.' },
  { min: 75, statement: 'Funds volunteer matching and three companionship visits for an isolated senior.' },
  { min: 25, statement: 'Covers a month of daily Aria check-in calls for a senior who lives alone.' },
  { min: 1, statement: 'Every gift helps a senior stay connected and supported at home.' },
]

export function impactFor(amountCents: number): string {
  const dollars = amountCents / 100
  return (DONATION_IMPACT_TIERS.find(t => dollars >= t.min) ?? DONATION_IMPACT_TIERS[DONATION_IMPACT_TIERS.length - 1]).statement
}

/** GET /api/donations?email=foo@bar.com — a donor's own giving history with impact statements. */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  if (!email) return NextResponse.json({ donations: [] })

  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('donations')
    .select('id, amount_cents, donation_date, payment_method, is_recurring, campaign, created_at')
    .eq('donor_email', email)
    .order('donation_date', { ascending: false })
    .limit(50) as unknown as { data: Array<Record<string, unknown>> | null; error: unknown }

  if (error) {
    console.error('[api/donations GET]', error)
    return NextResponse.json({ donations: [] })
  }

  const donations = (data ?? []).map(d => ({
    ...d,
    impact: impactFor(Number(d.amount_cents ?? 0)),
  }))
  return NextResponse.json({ donations })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.donor_name?.trim()) return NextResponse.json({ error: 'donor_name required' }, { status: 400 })
  if (!body?.amount_cents || Number(body.amount_cents) < 100) {
    return NextResponse.json({ error: 'amount_cents must be at least 100 (=$1.00)' }, { status: 400 })
  }

  const donor_name = String(body.donor_name).trim().slice(0, 200)
  const donor_email = body.donor_email ? String(body.donor_email).trim().slice(0, 200) : null
  const amount_cents = Math.round(Number(body.amount_cents))
  const payment_method = String(body.payment_method ?? 'other').trim()
  const campaign = body.campaign ? String(body.campaign).trim().slice(0, 200) : null
  const notes = body.notes ? String(body.notes).trim().slice(0, 1000) : null
  const is_recurring = Boolean(body.is_recurring)

  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('donations').insert({
    donor_name,
    donor_email,
    amount_cents,
    payment_method,
    donation_date: new Date().toISOString().slice(0, 10),
    is_recurring,
    campaign,
    notes,
  }).select('id').single() as unknown as { data: { id: string } | null; error: unknown }

  if (error || !data) {
    console.error('[api/donations]', error)
    return NextResponse.json({ error: 'Failed to record donation' }, { status: 500 })
  }

  console.log(`[STUB][Email] Would notify care team of $${(amount_cents / 100).toFixed(2)} donation from ${donor_name} (${donor_email ?? 'no email'})`)
  console.log(`[STUB][Email] Would send tax receipt to ${donor_email ?? 'donor'} for $${(amount_cents / 100).toFixed(2)}`)

  return NextResponse.json({ id: data.id, success: true, impact: impactFor(amount_cents) })
}
