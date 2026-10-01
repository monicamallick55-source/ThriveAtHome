// Placeholder — real implementation added in M8 (Phase 19)
// This file must exist for Turbopack build to succeed.
// It is only instantiated when ANTHROPIC_API_KEY is set in the environment.
import Anthropic from '@anthropic-ai/sdk'
import type { AiProvider, ConciergeTriage, CarePlan, Member, CheckInCall, LocalEventSuggestion } from '../interfaces/AiProvider'
import type { CallScores } from '../interfaces/EmailProvider'
import { requireServerEnv } from '../env'

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: requireServerEnv('ANTHROPIC_API_KEY') })
  return client
}

const CALL_MODEL = 'claude-opus-5-5'

export class AnthropicAiProvider implements AiProvider {
  // Post-call summary shown to navigators and (when the member allows it) family.
  // Must never quote the transcript at length — family never sees transcripts.
  async generateCallSummary(transcript: string): Promise<string | null> {
    if (!transcript.trim()) return null
    const response = await getClient().beta.messages.create({
      model: CALL_MODEL,
      max_tokens: 1000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: 'You summarise phone check-in calls between an AI companion and an older adult for their care team. ' +
        'Write 2–4 plain sentences: how they seemed, anything they need, and anything the care team should follow up on. ' +
        'Paraphrase — do not quote the conversation verbatim. Respond with only the summary.',
      messages: [{ role: 'user', content: transcript }],
    })
    if (response.stop_reason === 'refusal') return null
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()
    return text || null
  }

  // Scores come from the member's own words only (caller passes member speech).
  async extractCallScores(seniorSpeechOnly: string): Promise<CallScores> {
    const empty: CallScores = { mood_score: null, energy_score: null, pain_score: null, medication_taken: null, alert_flags: [] }
    if (!seniorSpeechOnly.trim()) return empty
    const nullableScore = { anyOf: [{ type: 'integer', minimum: 1, maximum: 10 }, { type: 'null' }] }
    const response = await getClient().beta.messages.create({
      model: CALL_MODEL,
      max_tokens: 1000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'low',
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              mood_score: nullableScore,
              energy_score: nullableScore,
              pain_score: nullableScore,
              medication_taken: { anyOf: [{ type: 'boolean' }, { type: 'null' }] },
              alert_flags: { type: 'array', items: { type: 'string' } },
            },
            required: ['mood_score', 'energy_score', 'pain_score', 'medication_taken', 'alert_flags'],
            additionalProperties: false,
          },
        },
      },
      system: 'You read what an older adult said during a wellness check-in call and rate it. ' +
        'mood_score and energy_score: 1 (very low) to 10 (excellent). pain_score: 1 (none) to 10 (severe). ' +
        'medication_taken: true/false only if they said so, otherwise null. Use null for any score the words give no evidence for. ' +
        'alert_flags: short snake_case labels for concerns (e.g. "fall_mentioned", "lonely", "missed_meals"), or an empty array.',
      messages: [{ role: 'user', content: seniorSpeechOnly }],
    })
    if (response.stop_reason === 'refusal') return empty
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
    const parsed = JSON.parse(text) as Partial<CallScores>
    const clamp = (n: unknown) => (typeof n === 'number' && n >= 1 && n <= 10 ? Math.round(n) : null)
    return {
      mood_score: clamp(parsed.mood_score),
      energy_score: clamp(parsed.energy_score),
      pain_score: clamp(parsed.pain_score),
      medication_taken: typeof parsed.medication_taken === 'boolean' ? parsed.medication_taken : null,
      alert_flags: Array.isArray(parsed.alert_flags) ? parsed.alert_flags.filter((f): f is string => typeof f === 'string') : [],
    }
  }
  async disambiguateCrisisContext(_phrase: string, _context: string): Promise<boolean> {
    throw new Error('[AnthropicAiProvider] Not yet implemented — add in M8')
  }
  async generateNavigatorBrief(_memberId: string, _summaries: string[]): Promise<string> {
    throw new Error('[AnthropicAiProvider] Not yet implemented — add in M8')
  }
  async generateCarePlan(_member: Member, _calls: CheckInCall[]): Promise<CarePlan> {
    throw new Error('[AnthropicAiProvider] Not yet implemented — add in M8')
  }
  async generateWeeklyDigest(_member: Member, _calls: CheckInCall[]): Promise<string> {
    throw new Error('[AnthropicAiProvider] Not yet implemented — add in M8')
  }
  async generateMonthlySummary(_member: Member, _calls: CheckInCall[]): Promise<string> {
    throw new Error('[AnthropicAiProvider] Not yet implemented — add in M8')
  }
  async generateCelebrationPersonalisation(_member: Member, _type: string): Promise<string> {
    throw new Error('[AnthropicAiProvider] Not yet implemented — add in M8')
  }
  async generateConciergeTriage(_transcript: string): Promise<ConciergeTriage> {
    throw new Error('[AnthropicAiProvider] Not yet implemented — add in M8')
  }
  async generateFamilyNudgeTopic(_member: Member, _recentCalls: CheckInCall[]): Promise<string> {
    throw new Error('[AnthropicAiProvider] Not yet implemented — add in M8')
  }
  async suggestLocalEvents(_city: string, _state: string, _interests: string[]): Promise<LocalEventSuggestion[]> {
    throw new Error('[AnthropicAiProvider] suggestLocalEvents — implement in M8 with web search tool')
  }

  async generateLifeStoryFollowups(entryTitle: string, entryContent: string): Promise<string[]> {
    try {
      const response = await getClient().messages.create({
        model: 'claude-opus-5',
        max_tokens: 500,
        system: 'You help seniors preserve their life story. Given one memory they just wrote down, ' +
          'write exactly two short, warm follow-up questions that would help them add more detail or a ' +
          'related memory next. Respond with ONLY a JSON array of exactly two strings — no other text.',
        messages: [{
          role: 'user',
          content: `Title: ${entryTitle}\n\nMemory: ${entryContent}`,
        }],
      })
      const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      if (!textBlock) return []
      const match = textBlock.text.match(/\[[\s\S]*\]/)
      if (!match) return []
      const parsed: unknown = JSON.parse(match[0])
      if (!Array.isArray(parsed)) return []
      return parsed.filter((q): q is string => typeof q === 'string').slice(0, 2)
    } catch (e) {
      console.error('[AnthropicAiProvider/generateLifeStoryFollowups] Failed:', e)
      return []
    }
  }
}
