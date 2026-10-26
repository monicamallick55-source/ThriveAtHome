// POST /api/retell/web-call
// Creates a Retell Web Call access token for the given agent.
// Used by QuinnWidget (and any future in-browser call buttons) to start a
// voice call without needing to embed the API key client-side.
//
// Request body: { agent: 'quinn' | 'rosa' | 'hope' | ... }
// Response:     { access_token: string, call_id: string }

import { NextRequest, NextResponse } from 'next/server'
import { AGENTS } from '@/lib/voice/agents'

const RETELL_API_URL = 'https://api.retellai.com'

// Rate-limit: max 5 web calls per IP per minute (simple in-memory bucket)
const callBucket = new Map<string, { count: number; resetAt: number }>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const bucket = callBucket.get(ip)
  if (!bucket || now > bucket.resetAt) {
    callBucket.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  if (bucket.count >= 5) return true
  bucket.count++
  return false
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RETELL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Voice calls are not configured yet.' }, { status: 503 })
  }

  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many calls. Please wait a minute and try again.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({})) as { agent?: string; dynamic_variables?: Record<string, string> }
  const agentName = (body.agent ?? 'quinn') as keyof typeof AGENTS

  if (!(agentName in AGENTS)) {
    return NextResponse.json({ error: `Unknown agent: ${agentName}` }, { status: 400 })
  }

  const agentConfig = AGENTS[agentName]
  const agentId = process.env[agentConfig.envVar]
  if (!agentId) {
    return NextResponse.json(
      { error: `Agent "${agentName}" is not configured. Please set ${agentConfig.envVar} in environment variables.` },
      { status: 503 }
    )
  }

  try {
    const retellRes = await fetch(`${RETELL_API_URL}/v2/create-web-call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId,
        // Optional metadata — useful for linking web calls to CRM records
        retell_llm_dynamic_variables: {
          channel: 'web_widget',
          agent:   agentName,
          ...(body.dynamic_variables ?? {}),
        },
      }),
    })

    if (!retellRes.ok) {
      const errText = await retellRes.text().catch(() => 'Retell API error')
      console.error('[Retell Web Call] API error:', retellRes.status, errText)
      return NextResponse.json(
        { error: 'Could not start call. Please try again.' },
        { status: 502 }
      )
    }

    const data = await retellRes.json() as { access_token: string; call_id: string }
    return NextResponse.json({ access_token: data.access_token, call_id: data.call_id })
  } catch (err) {
    console.error('[Retell Web Call] Unexpected error:', err)
    return NextResponse.json({ error: 'Voice service unavailable. Please try again.' }, { status: 503 })
  }
}
