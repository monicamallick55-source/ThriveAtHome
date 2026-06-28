import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('donations').insert({
    donor_name,
    donor_email,
    amount_cents,
    payment_method,
    donation_date: new Date().toISOString().slice(0, 10),
    campaign,
    notes,
  }).select('id').single() as unknown as { data: { id: string } | null; error: unknown }

  if (error || !data) {
    console.error('[api/donations]', error)
    return NextResponse.json({ error: 'Failed to record donation' }, { status: 500 })
  }

  console.log(`[STUB][Email] Would notify care team of $${(amount_cents / 100).toFixed(2)} donation from ${donor_name} (${donor_email ?? 'no email'})`)

  return NextResponse.json({ id: data.id, success: true })
}
