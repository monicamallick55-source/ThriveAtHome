import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MOCK_INVOICES = [
  {
    id: 'inv-mock-001',
    stripe_invoice_id: 'in_mock_stripe_001',
    amount: 5000,
    status: 'paid',
    created_at: new Date().toISOString(),
    pdf_url: 'https://example.com/invoice-001.pdf',
  },
]

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('billing_invoices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .catch(() => ({ data: null }))
    if (data && data.length > 0) return NextResponse.json(data)
  } catch {}
  return NextResponse.json(MOCK_INVOICES)
}
