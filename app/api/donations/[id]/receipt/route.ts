// POST /api/donations/[id]/receipt — emails the donor a PDF tax receipt for a past gift.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailProvider } from '@/lib/providers'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: donation, error } = await (admin.from as any)('donations')
    .select('id, donor_name, donor_email, amount_cents, donation_date, is_recurring')
    .eq('id', id)
    .maybeSingle() as unknown as {
      data: { id: string; donor_name: string; donor_email: string | null; amount_cents: number; donation_date: string; is_recurring: boolean } | null
      error: unknown
    }

  if (error) return NextResponse.json({ error: 'Could not look up this donation.' }, { status: 500 })
  if (!donation) return NextResponse.json({ error: 'Donation not found.' }, { status: 404 })
  if (!donation.donor_email) return NextResponse.json({ error: 'No email address on file for this donation.' }, { status: 400 })

  try {
    await emailProvider.sendDonationReceipt(
      donation.donor_email,
      donation.donor_name,
      donation.amount_cents,
      donation.donation_date,
      donation.is_recurring
    )
  } catch (e) {
    console.error('[api/donations/[id]/receipt]', e)
    return NextResponse.json({ error: 'Could not send the receipt right now — please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
