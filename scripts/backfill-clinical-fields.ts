// scripts/backfill-clinical-fields.ts
// G5.1 — Backfill clinical fields for calls with transcript but null clinical data
// Run: npx tsx scripts/backfill-clinical-fields.ts
// Processes in batches of 50; safe to re-run (skips already-populated rows)

import { createClient } from '@supabase/supabase-js'
import { extractClinicalFields } from '../lib/services/AnthropicAiProvider.clinical'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BATCH_SIZE = 50

async function main() {
  console.log('[backfill] Starting clinical field backfill...')
  let offset = 0
  let totalProcessed = 0
  let totalFailed = 0

  while (true) {
    // Fetch calls with transcript but no clinical data yet
    const { data: calls, error } = await (supabase as any)
      .from('check_in_calls')
      .select('id, retell_call_id, transcript, member_id')
      .not('transcript', 'is', null)
      .is('pain_mentioned', null)
      .eq('status', 'completed')
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) { console.error('[backfill] Query error:', error); break }
    if (!calls || calls.length === 0) { console.log('[backfill] No more calls to process.'); break }

    console.log(`[backfill] Processing batch of ${calls.length} calls (offset ${offset})...`)

    for (const call of calls) {
      // Check if member has opted out
      const { data: member } = await (supabase as any)
        .from('members')
        .select('ml_insights_opt_out')
        .eq('id', call.member_id)
        .maybeSingle()

      if (member?.ml_insights_opt_out) {
        console.log(`[backfill] Skipping opted-out member for call ${call.id}`)
        continue
      }

      try {
        const clinical = await extractClinicalFields(call.transcript)
        if (clinical) {
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
            .eq('id', call.id)
          totalProcessed++
          console.log(`[backfill] ✓ ${call.id}`)
        } else {
          console.log(`[backfill] No clinical data extracted for ${call.id}`)
        }
      } catch (err) {
        console.error(`[backfill] ✗ ${call.id}:`, err)
        totalFailed++
      }

      // Rate limit: 1 API call per second to avoid quota exhaustion
      await new Promise(r => setTimeout(r, 1000))
    }

    offset += calls.length
    if (calls.length < BATCH_SIZE) break
  }

  console.log(`[backfill] Done. Processed: ${totalProcessed}, Failed: ${totalFailed}`)
}

main().catch(console.error)
