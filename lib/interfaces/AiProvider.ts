// Interface for all AI-generated content — summaries, care plans, triage, etc.
import type { CallScores } from './EmailProvider'

export interface LocalEventSuggestion {
  title: string
  source: string
  date: string
  location: string
  description: string
  url: string
}

export interface ConciergeTriage {
  intent: 'service_request' | 'companionship_call' | 'emergency' | 'information' | 'care_team_transfer'
  serviceType?: 'transport' | 'meal' | 'companion' | 'tech_help' | 'home_service'
  urgency: 'low' | 'medium' | 'high' | 'emergency'
  summary: string
}

export interface CarePlan {
  wellnessSummary: string
  topStrengths: string[]
  areasForAttention: string[]
  recommendedActions: string[]
  communityOpportunities: string[]
  familyTalkingPoints: string[]
  nextReviewDate: string | null
}

export interface Member {
  id: string
  preferred_name: string
  full_name: string
  date_of_birth: string
  phone_number: string
  preferred_language: string
  topics_enjoy: string[]
  health_conditions: string | null
  medications: string | null
  plan_tier: string
}

export interface CheckInCall {
  id: string
  scheduled_at: string | null
  mood_score: number | null
  energy_score: number | null
  pain_score: number | null
  medication_taken: boolean | null
  ai_summary: string | null
  alert_flags: string[]
}

export interface AiProvider {
  generateCallSummary(transcript: string): Promise<string | null>
  extractCallScores(seniorSpeechOnly: string): Promise<CallScores>
  disambiguateCrisisContext(phrase: string, context: string): Promise<boolean>
  generateNavigatorBrief(memberId: string, summaries: string[]): Promise<string>
  generateCarePlan(member: Member, calls: CheckInCall[]): Promise<CarePlan>
  generateWeeklyDigest(member: Member, calls: CheckInCall[]): Promise<string>
  generateMonthlySummary(member: Member, calls: CheckInCall[]): Promise<string>
  generateCelebrationPersonalisation(member: Member, type: string): Promise<string>
  generateConciergeTriage(transcript: string): Promise<ConciergeTriage>
  generateFamilyNudgeTopic(member: Member, recentCalls: CheckInCall[]): Promise<string>
  suggestLocalEvents(city: string, state: string, interests: string[]): Promise<LocalEventSuggestion[]>
}
