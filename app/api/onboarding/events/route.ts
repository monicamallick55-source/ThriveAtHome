// app/api/onboarding/events/route.ts
// SSE endpoint — streams real-time field updates from Quinn's tool calls to the browser
// The browser opens this as an EventSource during the Quinn voice call

import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session')

  if (!sessionId) {
    return new Response('Missing session parameter', { status: 400 })
  }

  // Validate session exists
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: session, error } = await supabase
    .from('onboarding_sessions')
    .select('id, status')
    .eq('session_id', sessionId)
    .single()

  if (error || !session) {
    return new Response('Session not found', { status: 404 })
  }

  // Set up SSE stream
  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        if (closed) return
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          )
        } catch {
          // Controller already closed
        }
      }

      // Send initial snapshot so browser can pre-fill any already-captured fields
      const { data: snapshot } = await supabase
        .from('onboarding_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (snapshot) {
        send('snapshot', snapshot)
      }

      // Subscribe to realtime changes on this session row
      const channel = supabase
        .channel(`onboarding-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'onboarding_sessions',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const updated = payload.new as Record<string, unknown>

            // Send field-level update event so browser can update individual inputs
            send('field_update', updated)

            // Send status change events for flow control
            if (updated.status === 'pending_confirmation') {
              send('status', { status: 'pending_confirmation', data: updated })
            } else if (updated.status === 'ready_to_submit') {
              send('status', { status: 'ready_to_submit', data: updated })
            } else if (updated.status === 'submitted') {
              send('status', { status: 'submitted' })
            } else if (updated.status === 'error') {
              send('status', {
                status: 'error',
                error_type: updated.error_type,
                data: updated,
              })
            }
          }
        )
        .subscribe()

      // Keep-alive ping every 15 seconds so the connection doesn't drop
      const ping = setInterval(() => {
        send('ping', { ts: Date.now() })
      }, 15_000)

      // Clean up when client disconnects
      req.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(ping)
        supabase.removeChannel(channel)
        try {
          controller.close()
        } catch {
          // Already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering if present
    },
  })
}
