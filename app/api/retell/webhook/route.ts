/**
 * app/api/retell/webhook/route.ts — G5.1 Retell call webhook
 *
 * POST /api/retell/webhook
 *   Called by Retell when a call ends. Extracts clinical fields from
 *   the transcript using Claude, writes them to check_in_calls, and
 *   creates alerts as needed.
 *
 * Security: validates x-retell-signature HMAC-SHA256 header.
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import {
  extractClinicalFields,
  extractMemberSpeech,
  ICD10_MAP,
  type ClinicalExtraction,
} from '@/lib/ai/extractClinicalFields'

const ALERT_THRESHOLDS = {
  mood_score_low: 4,       // mood ≤ 4 → alert
  pain_score_high: 7,      // pain ≥ 7 → alert
  energy_score_low: 3,     // energy ≤ 3 → alert
}

async function verifySignature(req: NextRequest, body: string): Promise<boolean> {
  const secret = process.env.RETELL_API_KEY ?? ''
  if (!secret) return true  // skip in dev if no key set
  const sig = req.headers.get('x-retell-signature') ?? ''
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  return sig === expected
}

async function createAlertIfNeeded(
  supabase: any,
  memberId: string,
  orgId: string,
  callId: string,
  extraction: ClinicalExtraction,
) {
  const alerts: Array<{ alert_type: string; severity: string; message: string }> = []

  if (extraction.fall_risk_mention) {
    alerts.push({
      alert_type: 'fall_risk',
      severity: 'high',
      message: 'Member mentioned a fall or fall risk during their check-in call.',
    })
  }
  if (extraction.social_isolation_signal) {
    alerts.push({
      alert_type: 'social_isolation',
      severity: 'medium',
      message: 'Member expressed signs of social isolation or loneliness.',
    })
  }
  if (extraction.cognitive_concern_signal) {
    alerts.push({
      alert_type: 'cognitive_concern',
      severity: 'high',
      message: 'Member mentioned memory issues or confusion.',
    })
  }
  if (extraction.mood_score !== null && extraction.mood_score <= ALERT_THRESHOLDS.mood_score_low) {
    alerts.push({
      alert_type: 'low_mood',
      severity: 'medium',
      message: `Low mood detected (score ${extraction.mood_score}/10) during check-in call.`,
    })
  }
  if (extraction.pain_score !== null && extraction.pain_score >= ALERT_THRESHOLDS.pain_score_high) {
    alerts.push({
      alert_type: 'high_pain',
      severity: 'high',
      message: `High pain level reported (score ${extraction.pain_score}/10).`,
    })
  }

  for (const alert of alerts) {
    await supabase.from('alerts').insert({
      member_id: memberId,
      org_id: orgId,
      alert_type: alert.alert_type,
      severity: alert.severity,
      message: alert.message,
      source: 'retell_call',
      source_id: callId,
      icd10_codes: extraction.icd10_codes,
      status: 'open',
      created_at: new Date().toISOString(),
    }).then(({ error: _e }: { error: unknown }) => void _e)

    // High severity → navigator task
    if (alert.severity === 'high') {
      await supabase.from('navigator_tasks').insert({
        member_id: memberId,
        task_type: alert.alert_type,
        notes: alert.message,
        priority: 'high',
        status: 'pending',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        metadata: { call_id: callId, source: 'clinical_extraction' },
      }).then(({ error: _e }: { error: unknown }) => void _e)
    }
  }
}

export async function POST(req: NextRequest) {
  let bodyText = ''
  try {
    bodyText = await req.text()
    const valid = await verifySignature(req, bodyText)
    if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

    const payload = JSON.parse(bodyText)

    // Retell sends event_type = 'call_ended' for completed calls
    if (payload.event !== 'call_ended' && payload.event_type !== 'call_ended') {
      return NextResponse.json({ ok: true, skipped: 'not call_ended' })
    }

    const retellCallId: string = payload.call_id ?? payload.data?.call_id ?? ''
    const transcript: string = payload.transcript ?? payload.data?.transcript ?? ''
    const durationSeconds: number = payload.duration_ms ? Math.round(payload.duration_ms / 1000) : 0

    // Look up the member from the call metadata (Retell sends metadata we set at call creation)
    const memberId: string = payload.metadata?.member_id ?? payload.data?.metadata?.member_id ?? ''
    if (!memberId) return NextResponse.json({ ok: true, skipped: 'no member_id in metadata' })

    const supabase = await createClient()

    // Fetch member — check opt-out
    const { data: member } = await supabase
      .from('members')
      .select('id, org_id, ml_insights_opt_out')
      .eq('id', memberId)
      .single()

    if (!member) return NextResponse.json({ ok: true, skipped: 'member not found' })

    // Upsert the check_in_call row first (even if extraction is skipped)
    const { data: callRow } = await supabase
      .from('check_in_calls')
      .upsert({
        member_id: memberId,
        org_id: member.org_id,
        retell_call_id: retellCallId,
        transcript: transcript || null,
        duration_seconds: durationSeconds,
        call_ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'retell_call_id' })
      .select('id')
      .single()

    const callId = callRow?.id ?? retellCallId

    // Respect opt-out
    if (member.ml_insights_opt_out) {
      return NextResponse.json({ ok: true, clinical_extraction: 'skipped_opt_out' })
    }

    // Extract clinical fields from member speech only
    const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
    if (!apiKey || !transcript) {
      return NextResponse.json({ ok: true, clinical_extraction: 'skipped_no_key_or_transcript' })
    }

    const memberSpeech = extractMemberSpeech(transcript)
    const extraction = await extractClinicalFields(memberSpeech, apiKey)

    // Write clinical fields back to the call row
    await supabase
      .from('check_in_calls')
      .update({
        pain_mentioned: extraction.pain_mentioned,
        fall_risk_mention: extraction.fall_risk_mention,
        medication_adherence: extraction.medication_adherence,
        social_isolation_signal: extraction.social_isolation_signal,
        cognitive_concern_signal: extraction.cognitive_concern_signal,
        mood_score: extraction.mood_score,
        energy_score: extraction.energy_score,
        pain_score: extraction.pain_score,
        medication_taken: extraction.medication_taken,
        icd10_codes: extraction.icd10_codes,
        clinical_extracted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('retell_call_id', retellCallId)

    // Create alerts for concerning signals
    await createAlertIfNeeded(supabase, memberId, member.org_id, callId, extraction)

    return NextResponse.json({ ok: true, clinical_extraction: 'complete' })
  } catch (err: any) {
    console.error('Retell webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
