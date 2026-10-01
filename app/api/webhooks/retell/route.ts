// Retell webhook for all 12 agents: verify signature → route by event.
//   call_started              → in_progress row for member calls
//   call_ended / call_analyzed → processCallEnded (idempotent on retell_call_id)
//   tool_call                 → tool function called directly (no HTTP self-fetch)
import { NextRequest, NextResponse } from 'next/server'
import { verifyRetellRequest } from '@/lib/voice/verifyRetell'
import { TOOLS, type ToolArgs } from '@/lib/voice/tools'
import { toolContextFromCall } from '@/lib/voice/tools/types'
import { processCallEnded, recordCallStarted, type RetellCall } from '@/lib/voice/processCallEnded'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { ok, rawBody } = await verifyRetellRequest(req)
  if (!ok) {
    console.warn('[Retell Webhook] Rejected request with missing/invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: { event?: string; call?: RetellCall; tool_name?: string; name?: string; args?: ToolArgs; arguments?: ToolArgs }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { event, call } = body
  console.log('[Retell Webhook] Event:', event, 'Call ID:', call?.call_id)

  try {
    if (event === 'call_started' && call?.call_id) {
      await recordCallStarted(call)
      return NextResponse.json({ received: true })
    }

    if ((event === 'call_ended' || event === 'call_analyzed') && call?.call_id) {
      const result = await processCallEnded(call)
      console.log(
        `[Retell Webhook] ${event} ${call.call_id} — agent=${result.agent} caller=${result.callerRole} ` +
        `status=${result.status} skipped=${result.skipped} errors=${result.errors.length}`,
      )
      return NextResponse.json({ received: true, skipped: result.skipped })
    }

    if (event === 'tool_call') {
      const toolName = body.tool_name ?? body.name ?? ''
      const args = body.args ?? body.arguments ?? {}
      console.log(`[Retell Webhook] Tool call: ${toolName}`)

      const tool = TOOLS[toolName]
      if (!tool) {
        console.warn(`[Retell Webhook] Unknown tool: ${toolName}`)
        return NextResponse.json({ result: 'I can help with that. Let me make a note for your care team.' })
      }

      const outcome = await tool(args, toolContextFromCall(call))
      return NextResponse.json({ result: outcome.body.result ?? 'Done. Your care team has been notified.' })
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
