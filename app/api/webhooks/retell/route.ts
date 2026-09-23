import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, call } = body

    console.log('[Retell Webhook] Event:', event, 'Call ID:', call?.call_id)

    if (event === 'call_started') {
      console.log('[Retell Webhook] Call started — agent:', call?.agent_id)
    }

    if (event === 'call_ended') {
      const memberId = call?.metadata?.member_id
      const agentId = call?.agent_id
      const transcript = call?.transcript
      const duration = call?.duration_ms ? Math.round(call.duration_ms / 1000) : 0
      const callType = call?.metadata?.call_type ?? 'check_in'

      console.log(`[Retell Webhook] Call ended — member: ${memberId}, agent: ${agentId}, duration: ${duration}s`)

      if (memberId) {
        const { error: callErr } = await admin.from('check_in_calls').insert({
          member_id: memberId,
          agent_id: agentId ?? null,
          call_id: call.call_id,
          status: 'completed',
          call_type: 'check_in',
          duration_seconds: duration,
          transcript: transcript ?? null,
          scheduled_at: new Date().toISOString(),
          started_at: new Date(Date.now() - duration * 1000).toISOString(),
          ended_at: new Date().toISOString(),
        })
        if (callErr) console.error('[Retell Webhook] Failed to save call record:', callErr)

        // Mark onboarding complete if this was an onboarding call and it lasted > 60s
        if (callType === 'onboarding' && duration > 60) {
          await admin
            .from('members')
            .update({ onboarding_call_completed: true })
            .eq('id', memberId)
        }

        // Update last_aria_call_at
        await admin
          .from('members')
          .update({ last_aria_call_at: new Date().toISOString() })
          .eq('id', memberId)
      }
    }

    if (event === 'tool_call') {
      const toolName = body.tool_name ?? body.name
      const args = body.args ?? body.arguments ?? {}

      console.log(`[Retell Webhook] Tool call: ${toolName}`, args)

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thrive-at-home-pied.vercel.app'

      const toolRoutes: Record<string, string> = {
        'create_service_request': `${baseUrl}/api/retell/tools/service-request`,
        'flag_welfare_concern': `${baseUrl}/api/retell/tools/welfare-check`,
        'request_callback': `${baseUrl}/api/retell/tools/request-callback`,
      }

      const routeUrl = toolRoutes[toolName]
      if (!routeUrl) {
        console.warn(`[Retell Webhook] Unknown tool: ${toolName}`)
        return NextResponse.json({ result: 'I can help with that. Let me make a note for your care team.' })
      }

      const toolRes = await fetch(routeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ args }),
      })

      const toolData = await toolRes.json()
      return NextResponse.json({ result: toolData.result ?? 'Done. Your care team has been notified.' })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Retell Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ThriveAtHome Retell webhook active' })
}
