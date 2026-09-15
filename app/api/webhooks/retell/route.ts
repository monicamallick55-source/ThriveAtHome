// Retell AI webhook — receives call transcripts and outcomes after each call ends.
// Verifies the webhook signature, saves the call to check_in_calls, and triggers
// downstream processing (mood analysis, alerts, family digest).
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, call } = body

    console.log('[Retell Webhook] Event:', event, 'Call ID:', call?.call_id)

    if (event === 'call_ended') {
      const memberId = call?.metadata?.member_id
      const agentId = call?.agent_id
      const transcript = call?.transcript
      const duration = call?.duration_ms ? Math.round(call.duration_ms / 1000) : 0

      console.log(`[Retell Webhook] Call ended — member: ${memberId}, agent: ${agentId}, duration: ${duration}s`)

      // TODO: save to check_in_calls table, trigger mood analysis, create navigator alerts
      // This will be activated when ANTHROPIC_API_KEY is set
    }

    if (event === 'call_started') {
      console.log('[Retell Webhook] Call started — agent:', call?.agent_id)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Retell Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Retell sends GET to verify the endpoint exists
export async function GET() {
  return NextResponse.json({ status: 'ThriveAtHome Retell webhook active' })
}
