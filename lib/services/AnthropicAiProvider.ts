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

export class AnthropicAiProvider implements AiProvider {
  async generateCallSummary(_transcript: string): Promise<string | null> {
    throw new Error('[AnthropicAiProvider] Not yet implemented — add in M8')
  }
  async extractCallScores(_seniorSpeechOnly: string): Promise<CallScores> {
    throw new Error('[AnthropicAiProvider] Not yet implemented — add in M8')
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
