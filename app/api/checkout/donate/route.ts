import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { amount = 1000, recurring = false } = body as { amount?: number; recurring?: boolean }
    return NextResponse.json({ session_id: 'cs_stub_' + Date.now(), amount, recurring, url: '/donate/thank-you' })
  } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
}
