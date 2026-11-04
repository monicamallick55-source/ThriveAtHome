/**
 * lib/ai/extractClinicalFields.ts — G5.1
 * Extracts structured clinical signals from a Retell call transcript using Claude.
 * Returns validated fields; on any error returns nulls (never guesses).
 * Callers must check members.ml_insights_opt_out before calling.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

export interface ClinicalExtraction {
  pain_mentioned: boolean | null
  fall_risk_mention: boolean | null
  medication_adherence: boolean | null
  social_isolation_signal: boolean | null
  cognitive_concern_signal: boolean | null
  mood_score: number | null
  energy_score: number | null
  pain_score: number | null
  medication_taken: boolean | null
  icd10_codes: string[]
}

export const ICD10_MAP: Record<string, string[]> = {
  fall_risk_mention: ['W19', 'Z91.81'],
  social_isolation_signal: ['Z60.2'],
  cognitive_concern_signal: ['R41.82'],
  pain_mentioned: ['R52'],
}

const NULL_RESULT: ClinicalExtraction = {
  pain_mentioned: null, fall_risk_mention: null, medication_adherence: null,
  social_isolation_signal: null, cognitive_concern_signal: null,
  mood_score: null, energy_score: null, pain_score: null,
  medication_taken: null, icd10_codes: [],
}

function isValidScore(v: unknown, min: number, max: number): boolean {
  return typeof v === 'number' && v >= min && v <= max
}

function validateExtraction(raw: unknown): ClinicalExtraction | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  for (const key of ['pain_mentioned','fall_risk_mention','medication_adherence','social_isolation_signal','cognitive_concern_signal','medication_taken']) {
    if (r[key] !== null && r[key] !== undefined && typeof r[key] !== 'boolean') return null
  }
  if (r.mood_score !== null && r.mood_score !== undefined && !isValidScore(r.mood_score, 1, 10)) return null
  if (r.energy_score !== null && r.energy_score !== undefined && !isValidScore(r.energy_score, 1, 10)) return null
  if (r.pain_score !== null && r.pain_score !== undefined && !isValidScore(r.pain_score, 0, 10)) return null
  if (!Array.isArray(r.icd10_codes)) return null
  if (!r.icd10_codes.every((c: unknown) => typeof c === 'string')) return null
  return {
    pain_mentioned: (r.pain_mentioned as boolean | null) ?? null,
    fall_risk_mention: (r.fall_risk_mention as boolean | null) ?? null,
    medication_adherence: (r.medication_adherence as boolean | null) ?? null,
    social_isolation_signal: (r.social_isolation_signal as boolean | null) ?? null,
    cognitive_concern_signal: (r.cognitive_concern_signal as boolean | null) ?? null,
    mood_score: (r.mood_score as number | null) ?? null,
    energy_score: (r.energy_score as number | null) ?? null,
    pain_score: (r.pain_score as number | null) ?? null,
    medication_taken: (r.medication_taken as boolean | null) ?? null,
    icd10_codes: r.icd10_codes as string[],
  }
}

export async function extractClinicalFields(memberSpeech: string, apiKey: string): Promise<ClinicalExtraction> {
  if (!memberSpeech || memberSpeech.trim().length < 20) return NULL_RESULT
  const prompt = `You are a clinical NLP assistant. Analyze only the MEMBER's speech and extract clinical signals as JSON.

MEMBER SPEECH:
${memberSpeech.slice(0, 6000)}

Return ONLY valid JSON (use null when insufficient evidence):
{
  "pain_mentioned": boolean | null,
  "fall_risk_mention": boolean | null,
  "medication_adherence": boolean | null,
  "social_isolation_signal": boolean | null,
  "cognitive_concern_signal": boolean | null,
  "mood_score": number 1-10 | null,
  "energy_score": number 1-10 | null,
  "pain_score": number 0-10 | null,
  "medication_taken": boolean | null,
  "icd10_codes": string[]
}
icd10_codes: W19/Z91.81 (fall), Z60.2 (isolation), R41.82 (cognitive), R52 (pain). Return ONLY the JSON object.`
  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 512, messages: [{ role: 'user', content: prompt }] }),
    })
    if (!res.ok) return NULL_RESULT
    const data = await res.json()
    const text = data?.content?.[0]?.text?.trim() ?? ''
    const jsonText = text.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(jsonText)
    return validateExtraction(parsed) ?? NULL_RESULT
  } catch { return NULL_RESULT }
}

export function extractMemberSpeech(transcript: string): string {
  if (!transcript) return ''
  const memberLines: string[] = []
  for (const line of transcript.split('\n')) {
    const lower = line.toLowerCase()
    if (lower.startsWith('user:') || lower.startsWith('member:') || lower.startsWith('patient:')) {
      memberLines.push(line.replace(/^[^:]+:\s*/, '').trim())
    }
  }
  return memberLines.length > 0 ? memberLines.join(' ') : transcript
}
