import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') ?? ''
  if (!sig) return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
}
