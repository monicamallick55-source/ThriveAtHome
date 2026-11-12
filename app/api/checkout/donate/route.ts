import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { amount, recurring } = body as { amount?: number; recurring?: boolean }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount required' }, { status: 400 })
    }
    // Stub — real impl would create Stripe checkout session
    return NextResponse.json({
      session_id: 'cs_stub_' + Date.now(),
      amount,
      recurring: recurring ?? false,
      url: '/donate/thank-you',
    })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
