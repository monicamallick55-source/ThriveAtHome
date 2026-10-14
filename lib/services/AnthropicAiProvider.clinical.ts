// lib/services/AnthropicAiProvider.clinical.ts
// G5.1 — Clinical field extraction from call transcripts
// Stub: returns null until Anthropic API key is wired for production inference

export interface ClinicalFields {
  fall_risk_mention: boolean
  pain_mentioned: boolean
  social_isolation_signal: boolean
  medication_adherence: boolean | null
  cognitive_concern_signal: boolean
  mood_score: number | null        // 1–10
  energy_score: number | null      // 1–10
  pain_score: number | null        // 1–10
  medication_taken: boolean | null
  icd10_codes: string[]
}

/**
 * Extracts clinical signals from a call transcript using AI analysis.
 * Returns null if extraction fails or API is unavailable.
 */
export async function extractClinicalFields(
  transcript: string
): Promise<ClinicalFields | null> {
  // Stub: production implementation calls Anthropic Claude with a
  // structured prompt to extract clinical signals and ICD-10 codes.
  // Returns null so the webhook continues without clinical data.
  if (!process.env.ANTHROPIC_API_KEY) return null

  try {
    // TODO: implement Anthropic API call for clinical extraction
    // const response = await anthropic.messages.create({ ... })
    return null
  } catch {
    return null
  }
}
