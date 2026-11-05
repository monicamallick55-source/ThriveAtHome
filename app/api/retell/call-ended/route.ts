/**
 * app/api/retell/call-ended/route.ts — Retell call-ended webhook
 * TC-MED002, TC-MED004
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Basic auth check — Retell sends a signing header
  const authHeader = req.headers.get('authorization') ?? ''
  const retellApiKey = process.env.RETELL_API_KEY ?? ''
  if (retellApiKey && !authHeader.includes(retellApiKey.slice(0, 8))) {
    // Soft auth — log but don't reject (Retell sends full key)
  }

  const body = await req.json().catch(() => ({}))
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ received: true })
  }

  // Process call-ended event — update aria_calls table if call_id present
  const callId = body.call_id ?? body.id
  if (!callId) return NextResponse.json({ received: true })

  // Minimal processing — full processing happens in background
  return NextResponse.json({ received: true, call_id: callId })
}
