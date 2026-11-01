// lib/services/AnthropicAiProvider.clinical.ts
// G5.1 — Clinical field extraction from call transcripts (REAL IMPLEMENTATION)

import Anthropic from '@anthropic-ai/sdk'

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

const ICD10_MAP: Record<string, string[]> = {
  fall_risk:  ['W19', 'Z91.81'],
  pain:       ['R52'],
  isolation:  ['Z60.2'],
  cognitive:  ['R41.82'],
}

/** Extract only the member/user side of a Retell transcript */
function memberSpeech(transcript: string): string {
  const lines = transcript.split('\n')
  const member = lines
    .filter(l => /^(user|member|senior)\s*:/i.test(l.trim()))
    .map(l => l.replace(/^[^:]+:\s*/i, '').trim())
  // If no labelled lines found, use the whole transcript
  return member.length > 0 ? member.join(' ') : transcript
}

export async function extractClinicalFields(
  transcript: string
): Promise<ClinicalFields | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null

  const speech = memberSpeech(transcript).slice(0, 5000)
  if (speech.trim().length < 20) return null

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are a clinical documentation assistant reviewing a senior wellness call transcript.
Analyse ONLY the senior's speech below and extract clinical signals. Be conservative — only mark something true if the senior clearly stated it. Do not infer from silence.

Senior's speech:
<speech>
${speech}
</speech>

Return ONLY a valid JSON object with these exact fields (no markdown, no explanation):
{
  "fall_risk_mention": boolean,          // senior mentioned a fall, near-fall, or fear of falling
  "pain_mentioned": boolean,             // senior mentioned physical pain or discomfort
  "social_isolation_signal": boolean,    // senior expressed loneliness, isolation, or lack of contact
  "medication_adherence": boolean|null,  // true = taking meds as prescribed, false = not, null = not discussed
  "cognitive_concern_signal": boolean,   // senior mentioned memory problems, confusion, or cognitive difficulty
  "mood_score": number|null,             // 1 (very low) to 10 (excellent), null if not determinable
  "energy_score": number|null,           // 1 (exhausted) to 10 (very energetic), null if not determinable
  "pain_score": number|null,             // 1 (severe) to 10 (no pain), null if not mentioned
  "medication_taken": boolean|null       // true = took today's meds, false = did not, null = not mentioned
}`

  try {
    const msg = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (msg.content[0] as { type: string; text: string }).text?.trim() ?? ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    // Validate required boolean fields
    const required = [
      'fall_risk_mention','pain_mentioned','social_isolation_signal','cognitive_concern_signal',
    ]
    for (const f of required) {
      if (typeof parsed[f] !== 'boolean') return null
    }

    // Build ICD-10 codes from signals
    const codes: string[] = []
    if (parsed.fall_risk_mention)        codes.push(...ICD10_MAP.fall_risk)
    if (parsed.pain_mentioned)           codes.push(...ICD10_MAP.pain)
    if (parsed.social_isolation_signal)  codes.push(...ICD10_MAP.isolation)
    if (parsed.cognitive_concern_signal) codes.push(...ICD10_MAP.cognitive)

    return {
      fall_risk_mention:        parsed.fall_risk_mention,
      pain_mentioned:           parsed.pain_mentioned,
      social_isolation_signal:  parsed.social_isolation_signal,
      medication_adherence:     typeof parsed.medication_adherence === 'boolean' ? parsed.medication_adherence : null,
      cognitive_concern_signal: parsed.cognitive_concern_signal,
      mood_score:       typeof parsed.mood_score === 'number' ? parsed.mood_score : null,
      energy_score:     typeof parsed.energy_score === 'number' ? parsed.energy_score : null,
      pain_score:       typeof parsed.pain_score === 'number' ? parsed.pain_score : null,
      medication_taken: typeof parsed.medication_taken === 'boolean' ? parsed.medication_taken : null,
      icd10_codes: codes,
    }
  } catch (err) {
    console.error('[extractClinicalFields] extraction error:', err)
    return null
  }
}
