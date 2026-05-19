// Edge Function: push-notification
// Inserts a row into realtime_notifications, triggering Supabase Realtime for the member.
// Called from other Edge Functions (create-alert, check-missed-calls) — never from the browser.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Require authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    const { memberId, type, title, body: notifBody, severity, callId, alertId } = body

    // Validate required fields
    if (!memberId || !type || !title || !notifBody) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: memberId, type, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error } = await admin.from('realtime_notifications').insert({
      member_id: memberId,
      type,
      title,
      body: notifBody,
      severity: severity ?? 'info',
      call_id: callId ?? null,
      alert_id: alertId ?? null,
    })

    if (error) {
      console.error('[push-notification] Insert failed:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[push-notification]:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
