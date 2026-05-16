// Stub implementation — returns typed placeholders, no real AI calls. Replaced in M8 with AnthropicAiProvider.
import type { AiProvider, ConciergeTriage, CarePlan, Member, CheckInCall } from '../interfaces/AiProvider'
import type { CallScores } from '../interfaces/EmailProvider'

export class StubAiProvider implements AiProvider {
  async generateCallSummary(_transcript: string): Promise<string | null> {
    console.log('[STUB][AI] generateCallSummary called')
    return 'Call completed. Member seemed well.'
  }
  async extractCallScores(_seniorSpeechOnly: string): Promise<CallScores> {
    console.log('[STUB][AI] extractCallScores called')
    return { mood_score: null, energy_score: null, pain_score: null, medication_taken: null, alert_flags: [] }
  }
  async disambiguateCrisisContext(_phrase: string, _context: string): Promise<boolean> {
    console.log('[STUB][AI] disambiguateCrisisContext called — returning false (safe default)')
    return false
  }
  async generateNavigatorBrief(_memberId: string, _summaries: string[]): Promise<string> {
    console.log('[STUB][AI] generateNavigatorBrief called')
    return 'Navigator brief not yet available — AI calls enabled in M8.'
  }
  async generateCarePlan(_member: Member, _calls: CheckInCall[]): Promise<CarePlan> {
    console.log('[STUB][AI] generateCarePlan called')
    return {
      wellnessSummary: 'Care plan not yet available.',
      topStrengths: [], areasForAttention: [], recommendedActions: [],
      communityOpportunities: [], familyTalkingPoints: [], nextReviewDate: null,
    }
  }
  async generateWeeklyDigest(_member: Member, _calls: CheckInCall[]): Promise<string> {
    console.log('[STUB][AI] generateWeeklyDigest called')
    return 'Weekly digest not yet available.'
  }
  async generateMonthlySummary(_member: Member, _calls: CheckInCall[]): Promise<string> {
    console.log('[STUB][AI] generateMonthlySummary called')
    return 'Monthly summary not yet available.'
  }
  async generateCelebrationPersonalisation(_member: Member, type: string): Promise<string> {
    console.log(`[STUB][AI] generateCelebrationPersonalisation called for type: ${type}`)
    return 'Personalised message coming soon.'
  }
  async generateConciergeTriage(_transcript: string): Promise<ConciergeTriage> {
    console.log('[STUB][AI] generateConciergeTriage called')
    return { intent: 'information', urgency: 'low', summary: 'Concierge triage not yet available.' }
  }
  async generateFamilyNudgeTopic(_member: Member, _recentCalls: CheckInCall[]): Promise<string> {
    console.log('[STUB][AI] generateFamilyNudgeTopic called')
    return 'Ask about their week.'
  }
}
