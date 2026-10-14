// lib/voice/processCallEnded.ts
// G1.4 + G5.1 — 9-step idempotent call processor with clinical field extraction
// G5.1 adds: extractClinicalFields, ICD-10 mapping, ml_insights_opt_out honour

import { createClient } from '@/lib/supabase/server'
import { agentNameFromId, AGENTS } from './agents'
import { extractClinicalFields } from '@/lib/services/AnthropicAiProvider.clinical'
import { scanAndFlag } from '@/lib/fraud/flagService'

export interface RetellCallEndedPayload {
  call_id: string
  agent_id: string
  from_number?: string
  to_number?: string
  duration_seconds?: number
  transcript?: string
  call_analysis?: {
    call_summary?: string
    in_voicemail?: boolean
    user_sentiment?: string
  }
}

export async function processCallEnded(payload: RetellCallEndedPayload) {
  const supabase = await createClient()
  const {
    call_id, agent_id, from_number, to_number,
    duration_seconds, transcript, call_analysis,
  } = payload

  // Step 1: Idempotency check
  const { data: existing } = await supabase
    .from('check_in_calls')
    .select('id, processed_at')
    .eq('retell_call_id', call_id)
    .maybeSingle()
  if (existing?.processed_at) return { skipped: true, reason: 'already_processed' }

  // Step 2: Identify agent
  const agentName = agentNameFromId(agent_id)
  const agent = agentName ? AGENTS[agentName] : null
  if (!agent) {
    console.error('[processCallEnded] Unknown agent_id:', agent_id)
    return { error: 'unknown_agent' }
  }

  // Step 3: Route inbound calls
  if (agent.direction === 'inbound') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('inbound_call_log').upsert({
      call_id, agent_id, agent_name: agent.name,
      from_number, to_number, duration_seconds,
      status: 'completed',
      summary: call_analysis?.call_summary ?? null,
      transcript: transcript ?? null,
      processed_at: new Date().toISOString(),
    }, { onConflict: 'call_id' })
    return { routed: 'inbound_call_log' }
  }

  // Step 4: Find member by phone
  const { data: member } = await supabase
    .from('members')
    .select('id, full_name, ml_insights_opt_out')
    .eq('phone', to_number ?? '')
    .maybeSingle()

  const memberId = member?.id ?? null
  const summary = call_analysis?.call_summary ?? ''

  // Step 5: Upsert call row (basic fields first)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('check_in_calls').upsert({
    retell_call_id: call_id,
    agent_id,
    agent_name: agent.name,
    call_type: agent.callType,
    direction: agent.direction,
    from_number,
    to_number,
    duration_seconds,
    transcript: transcript ?? null,
    summary,
    status: 'completed',
    member_id: memberId,
  }, { onConflict: 'retell_call_id' })

  // Step 6: G5.1 — Extract clinical fields + ICD-10 (skip if opted out)
  if (memberId && !member?.ml_insights_opt_out && transcript) {
    try {
      const clinical = await extractClinicalFields(transcript)
      if (clinical) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('check_in_calls')
          .update({
            fall_risk_mention:        clinical.fall_risk_mention,
            pain_mentioned:           clinical.pain_mentioned,
            social_isolation_signal:  clinical.social_isolation_signal,
            medication_adherence:     clinical.medication_adherence,
            cognitive_concern_signal: clinical.cognitive_concern_signal,
            mood_score:               clinical.mood_score,
            energy_score:             clinical.energy_score,
            pain_score:               clinical.pain_score,
            medication_taken:         clinical.medication_taken,
            icd10_codes:              clinical.icd10_codes,
          })
          .eq('retell_call_id', call_id)
      }
    } catch (err) {
      // Never fail the webhook due to extraction error
      console.error('[processCallEnded] Clinical extraction failed:', err)
    }
  }

  // Step 7: G7.1 — Scan transcript for fraud patterns
  if (memberId && transcript) {
    try {
      const flagIds = await scanAndFlag(transcript, memberId, 'call_transcript', call_id)
      if (flagIds.length > 0) {
        console.log(`[processCallEnded] Fraud flags created: ${flagIds.length} (${flagIds.join(',')})`)
      }
    } catch (err) {
      console.error('[processCallEnded] Fraud scan failed:', err)
    }
  }

  // Step 8: Mark processed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('check_in_calls')
    .update({ processed_at: new Date().toISOString() })
    .eq('retell_call_id', call_id)

  return { processed: true, memberId, callId: call_id }
}
