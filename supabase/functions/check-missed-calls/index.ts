// Edge Function: check-missed-calls
// Cron-triggered (every hour). Scans for calls that were scheduled more than
// 30 minutes ago but never started, marks them 'missed', and fires a missed_call alert.
// Invoke via: POST /functions/v1/check-missed-calls with header x-cron-secret: <CRON_SECRET>

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Auth: cron secret header
    const cronSecret = req.headers.get('x-cron-secret')
    if (!cronSecret || cronSecret !== Deno.env.get('CRON_SECRET')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Find calls scheduled > 30 minutes ago that are still in 'scheduled' state
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()

    const { data: staleCalls, error: fetchError } = await admin
      .from('check_in_calls')
      .select('id, member_id, scheduled_at')
      .eq('status', 'scheduled')
      .lt('scheduled_at', cutoff)

    if (fetchError) {
      console.error('[check-missed-calls] Fetch failed:', fetchError.message)
      return new Response(JSON.stringify({ error: 'Failed to fetch stale calls' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: Array<{ callId: string; memberId: string; status: string }> = []

    for (const call of staleCalls ?? []) {
      // Mark call as missed
      const { error: updateError } = await admin
        .from('check_in_calls')
        .update({ status: 'missed' })
        .eq('id', call.id)

      if (updateError) {
        console.error('[check-missed-calls] Update failed for call', call.id, ':', updateError.message)
        results.push({ callId: call.id, memberId: call.member_id, status: 'update_failed' })
        continue
      }

      // Dedup check: no missed_call alert in last 24h for this member
      const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: existing } = await admin
        .from('alerts')
        .select('id')
        .eq('member_id', call.member_id)
        .eq('alert_type', 'missed_call')
        .gte('created_at', windowStart)
        .limit(1)
        .maybeSingle()

      if (existing) {
        results.push({ callId: call.id, memberId: call.member_id, status: 'deduped' })
        continue
      }

      // Create missed_call alert
      const { data: alert, error: alertError } = await admin
        .from('alerts')
        .insert({
          member_id: call.member_id,
          call_id: call.id,
          alert_type: 'missed_call',
          severity: 'informational',
          message: 'A scheduled check-in call was not completed.',
        })
        .select('id')
        .maybeSingle()

      if (alertError || !alert) {
        console.error('[check-missed-calls] Alert insert failed:', alertError?.message)
        results.push({ callId: call.id, memberId: call.member_id, status: 'alert_failed' })
        continue
      }

      // Realtime notification
      await admin.from('realtime_notifications').insert({
        type: 'new_alert',
        member_id: call.member_id,
        title: 'Health Update',
        body: 'A scheduled check-in call was not completed.',
        severity: 'info',
        alert_id: alert.id,
        call_id: call.id,
      })

      results.push({ callId: call.id, memberId: call.member_id, status: 'alert_created' })
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[check-missed-calls]:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
