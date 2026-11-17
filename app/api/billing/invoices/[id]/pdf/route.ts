import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    url: `https://example.com/invoices/${params.id}.pdf`,
    pdf_url: `https://example.com/invoices/${params.id}.pdf`,
  })
}
