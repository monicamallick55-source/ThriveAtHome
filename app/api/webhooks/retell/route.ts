import { NextRequest, NextResponse } from 'next/server'
import { verifyRetellSignature } from '@/lib/voice/verifyRetell'
import { processCallEnded } from '@/lib/voice/processCallEnded'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export async function GET() {
  return NextResponse.json({ ok: true, service: 'retell-webhook' })
}
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-retell-signature')
  const { ok, reason } = verifyRetellSignature(rawBody, signature)
  if (!ok) { console.warn('[Retell] rejected:', reason); return NextResponse.json({ error: reason }, { status: 401 }) }
  let payload: Record<string, unknown>
  try { payload = JSON.parse(rawBody) } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }) }
  const event = payload.event as string
  const call = payload.data as Record<string, unknown>
  try {
    switch (event) {
      case 'call_started':
        await supabase.from('check_in_calls').upsert({
          retell_call_id: call.call_id, agent_id: call.agent_id,
          status: 'in_progress', direction: call.direction ?? 'outbound',
          started_at: new Date().toISOString(),
        }, { onConflict: 'retell_call_id' }).catch(console.error)
        break
      case 'call_ended':
      case 'call_analyzed':
        await processCallEnded(call as Parameters<typeof processCallEnded>[0])
        break
      case 'tool_call':
        await handleTool(call)
        break
      default:
        console.log('[Retell] unhandled event:', event)
    }
  } catch (err) {
    console.error('[Retell] error:', err)
    return NextResponse.json({ error: 'processing error' })
  }
  return NextResponse.json({ ok: true })
}
async function handleTool(call: Record<string, unknown>) {
  const tool = call.tool_name as string
  const args = (call.args ?? {}) as Record<string, unknown>
  const memberId = (call.metadata as Record<string,string>)?.member_id ?? null
  const routes: Record<string, () => Promise<unknown>> = {
    'welfare_check':           () => import('@/lib/voice/tools/welfareCheck').then(m => m.run(args, memberId)),
    'schedule_service':        () => import('@/lib/voice/tools/scheduleService').then(m => m.run(args, memberId)),
    'get_member_info':         () => import('@/lib/voice/tools/getMemberInfo').then(m => m.run(args, memberId)),
    'update_call_preferences': () => import('@/lib/voice/tools/updateCallPreferences').then(m => m.run(args, memberId)),
    'create_navigator_task':   () => import('@/lib/voice/tools/createNavigatorTask').then(m => m.run(args, memberId)),
  }
  const h = routes[tool]
  if (!h) { console.warn('[Retell] unknown tool:', tool); return }
  try { await h() } catch (e) { console.error(`[Retell] tool ${tool} failed:`, e) }
}
