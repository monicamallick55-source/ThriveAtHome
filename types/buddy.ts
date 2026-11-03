export type BuddyAssignmentStatus = 'active' | 'paused' | 'ending' | 'ended'
export type BuddyCallFrequency = 'weekly' | 'biweekly'

export interface BuddyAssignment {
  id: string
  member_id: string
  volunteer_id: string
  assigned_at: string
  status: BuddyAssignmentStatus
  call_frequency: BuddyCallFrequency
  preferred_call_day: string | null
  preferred_call_time: string | null
  match_score: number | null
  match_reasons: string[] | null
  navigator_notes: string | null
  ended_at: string | null
  end_reason: string | null
  transition_buddy_id: string | null
  created_at: string
  volunteer?: { id: string; first_name: string; last_name: string; buddy_bio: string | null; buddy_capacity: number; buddy_active_count: number; email: string }
  member?: { id: string; first_name: string; last_name: string; preferred_name: string | null; has_active_buddy: boolean }
  buddy_calls?: BuddyCall[]
}

export interface BuddyAssignmentInsert {
  member_id: string
  volunteer_id: string
  status?: BuddyAssignmentStatus
  call_frequency?: BuddyCallFrequency
  preferred_call_day?: string
  preferred_call_time?: string
  match_score?: number
  match_reasons?: string[]
  navigator_notes?: string
}

export interface BuddyCall {
  id: string
  assignment_id: string
  member_id: string
  volunteer_id: string
  scheduled_at: string | null
  started_at: string | null
  duration_minutes: number | null
  call_quality: number | null
  buddy_notes: string | null
  family_note: string | null
  concern_flag: boolean
  concern_description: string | null
  milestone_flag: boolean
  milestone_description: string | null
  aria_brief_shown: boolean
  aria_context_snapshot: Record<string, unknown> | null
  created_at: string
  volunteer?: { first_name: string; last_name: string }
  member?: { first_name: string; preferred_name: string | null }
}

export interface BuddyCallInsert {
  assignment_id: string
  member_id: string
  volunteer_id: string
  scheduled_at?: string
  started_at?: string
  duration_minutes?: number
  call_quality?: number
  buddy_notes?: string
  family_note?: string
  concern_flag?: boolean
  concern_description?: string
  milestone_flag?: boolean
  milestone_description?: string
  aria_brief_shown?: boolean
  aria_context_snapshot?: Record<string, unknown>
}

export interface AriaBrief {
  memberId: string
  memberName: string
  briefText: string
  generatedAt: string
  sourceSummaryCount: number
}
