// family-nudge-check — cron Edge Function: notifies family members who haven't checked in for 7+ days
// when there are active (unacknowledged) alerts for their senior.
// Dedup window: 7 days — only one nudge per family member per week.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

const NUDGE_WINDOW_DAYS = 7
const DEDUP_WINDOW_DAYS = 7

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify cron secret to prevent unauthorised triggers
  const cronSecret = Deno.env.get('CRON_SECRET')
  const incoming = req.headers.get('x-cron-secret')
  if (!cronSecret || incoming !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const admin = createClient(supabaseUrl, serviceKey)

  const now = new Date()
  const cutoff = new Date(now.getTime() - NUDGE_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const dedupCutoff = new Date(now.getTime() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  // 1. Find family members who haven't logged in for >= 7 days (or never logged in)
  //    and are linked to an active member
  const { data: candidates, error: candidatesError } = await admin
    .from('family_members')
    .select('id, member_id, full_name')
    .not('member_id', 'is', null)
    .or(`last_login_at.is.null,last_login_at.lte.${cutoff.toISOString()}`)

  if (candidatesError) {
    console.error('[family-nudge-check] candidates query:', candidatesError)
    return new Response(
      JSON.stringify({ error: 'Failed to query family members', detail: candidatesError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let nudgesSent = 0
  let nudgesSkipped = 0

  for (const fm of (candidates ?? [])) {
    if (!fm.member_id) continue

    // 2. Check if there are unacknowledged alerts for this member
    const { data: alerts, error: alertsError } = await admin
      .from('alerts')
      .select('id')
      .eq('member_id', fm.member_id)
      .eq('acknowledged', false)
      .limit(1)

    if (alertsError) {
      console.error('[family-nudge-check] alerts check:', alertsError)
      continue
    }

    if (!alerts || alerts.length === 0) {
      nudgesSkipped++
      continue
    }

    // 3. Dedup: check if we already sent a family_nudge in the last 7 days for this member
    const { data: recent, error: recentError } = await admin
      .from('realtime_notifications')
      .select('id')
      .eq('member_id', fm.member_id)
      .eq('type', 'family_nudge')
      .gte('created_at', dedupCutoff.toISOString())
      .limit(1)

    if (recentError) {
      console.error('[family-nudge-check] dedup check:', recentError)
      continue
    }

    if (recent && recent.length > 0) {
      nudgesSkipped++
      continue
    }

    // 4. Insert family_nudge notification
    const { error: insertError } = await admin.from('realtime_notifications').insert({
      member_id: fm.member_id,
      type: 'family_nudge',
      title: 'Family check-in reminder',
      body: `Your family member hasn't checked the app in a week and there are active alerts. Please log in to review.`,
      severity: 'concern',
    })

    if (insertError) {
      console.error('[family-nudge-check] insert notification:', insertError)
      continue
    }

    nudgesSent++
  }

  return new Response(
    JSON.stringify({
      ok: true,
      candidates: (candidates ?? []).length,
      nudgesSent,
      nudgesSkipped,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
