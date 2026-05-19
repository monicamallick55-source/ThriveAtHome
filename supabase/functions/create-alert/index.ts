// Edge Function: create-alert
// Receives alert data from call processing, applies 24h deduplication,
// writes emergency_log first for crisis/emergency types, then inserts the alert row.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type AlertType = 'missed_call' | 'mood_drop' | 'medication_miss' | 'wellness_drift' | 'fall' | 'crisis' | 'emergency'
type AlertSeverity = 'informational' | 'concern' | 'urgent' | 'emergency'

interface AlertRequest {
  memberId: string
  callId?: string
  alertType: AlertType
  severity: AlertSeverity
  message: string
  dedupWindowHours: number
  writesEmergencyLog?: boolean
  triggeredPhrase?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Auth: must be an authenticated Supabase service-role call (from another Edge Function or server)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body: AlertRequest = await req.json()
    const { memberId, callId, alertType, severity, message, dedupWindowHours, writesEmergencyLog, triggeredPhrase } = body

    // Validate required fields
    if (!memberId || !alertType || !severity || !message || dedupWindowHours === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields: memberId, alertType, severity, message, dedupWindowHours' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 1 — emergency_log first for crisis/emergency
    if (writesEmergencyLog) {
      const { error: logError } = await admin.from('emergency_log').insert({
        member_id: memberId,
        call_id: callId ?? null,
        alert_type: alertType,
        triggered_phrase: triggeredPhrase ?? null,
      })
      if (logError) console.error('[create-alert] emergency_log failed:', logError.message)
    }

    // Step 2 — deduplication check
    if (dedupWindowHours > 0) {
      const windowStart = new Date(Date.now() - dedupWindowHours * 60 * 60 * 1000).toISOString()
      const { data: existing } = await admin
        .from('alerts')
        .select('id')
        .eq('member_id', memberId)
        .eq('alert_type', alertType)
        .gte('created_at', windowStart)
        .limit(1)
        .maybeSingle()

      if (existing) {
        return new Response(JSON.stringify({ alertId: existing.id, deduplicated: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Step 3 — insert alert
    const { data: alert, error: insertError } = await admin
      .from('alerts')
      .insert({ member_id: memberId, call_id: callId ?? null, alert_type: alertType, severity, message })
      .select('id')
      .maybeSingle()

    if (insertError || !alert) {
      console.error('[create-alert] Insert failed:', insertError?.message)
      return new Response(JSON.stringify({ error: 'Alert insert failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 4 — Realtime notification
    const notifSeverity = severity === 'informational' ? 'info' : severity
    const notifTitle = severity === 'emergency' ? '🚨 Emergency Alert' : severity === 'urgent' ? '⚠️ Urgent Alert' : severity === 'concern' ? 'Alert: Attention Needed' : 'Health Update'

    await admin.from('realtime_notifications').insert({
      type: 'new_alert',
      member_id: memberId,
      title: notifTitle,
      body: message,
      severity: notifSeverity,
      alert_id: alert.id,
      call_id: callId ?? null,
    })

    return new Response(JSON.stringify({ alertId: alert.id, deduplicated: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[create-alert]:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
