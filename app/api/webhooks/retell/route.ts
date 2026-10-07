import { NextRequest, NextResponse } from 'next/server'
import { verifyRetellSignature } from '@/lib/voice/verifyRetell'
import { processCallEnded } from '@/lib/voice/processCallEnded'

const WEBHOOK_SECRET = process.env.RETELL_WEBHOOK_SECRET ?? ''

export async function POST(req: NextRequest) {
  // Verify signature
  const rawBody = await req.text()
  const signature = req.headers.get('x-retell-signature')

  if (WEBHOOK_SECRET && !verifyRetellSignature(rawBody, signature, WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only process call_ended events
  if (payload.event !== 'call_ended') {
    return NextResponse.json({ received: true })
  }

  try {
    const result = await processCallEnded(payload)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[retell webhook]', err)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
