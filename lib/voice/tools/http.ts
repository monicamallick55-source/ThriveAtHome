// Shared HTTP wrapper for /api/retell/tools/* routes: verify signature → parse → run tool.
import { NextResponse } from 'next/server'
import { verifyRetellRequest } from '../verifyRetell'
import type { ToolArgs, ToolFn } from './index'

export async function handleToolRequest(req: Request, tool: ToolFn, label: string): Promise<NextResponse> {
  const { ok, rawBody } = await verifyRetellRequest(req)
  if (!ok) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

  let body: { args?: ToolArgs; call?: { call_id?: string; metadata?: { member_id?: string } } } & ToolArgs
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  try {
    const args = (body.args ?? body) as ToolArgs
    const outcome = await tool(args, {
      callId: body.call?.call_id ?? null,
      memberId: body.call?.metadata?.member_id ?? null,
    })
    return NextResponse.json(outcome.body, { status: outcome.status })
  } catch (error) {
    console.error(`[Retell Tool] ${label} error:`, error)
    return NextResponse.json({ error: `${label} tool failed` }, { status: 500 })
  }
}
