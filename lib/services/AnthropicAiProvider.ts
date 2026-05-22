// Placeholder — real implementation added in M8 (Phase 19)
// This file must exist for Turbopack build to succeed.
// It is only instantiated when ANTHROPIC_API_KEY is set in the environment.
import type { AiProvider, ConciergeTriage, CarePlan, Member, CheckInCall } from '../interfaces/AiProvider'
import type { CallScores } from '../interfaces/EmailProvider'

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
}
