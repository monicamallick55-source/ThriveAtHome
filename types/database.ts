// Supabase database type definitions — matches the schema in supabase/migrations/001_initial_schema.sql.
// Generated manually from the migration file. Keep in sync when schema changes.

export type PlanTier = 'basics' | 'connect' | 'complete' | 'premier'
export type MemberStatus = 'active' | 'inactive' | 'paused'
export type UserRole = 'family' | 'navigator' | 'admin' | 'volunteer'
export type CallStatus = 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'failed'
export type CallType = 'check_in' | 'concierge' | 'navigator'
export type AlertType = 'missed_call' | 'mood_drop' | 'medication_miss' | 'wellness_drift' | 'fall' | 'crisis' | 'emergency'
export type AlertSeverity = 'informational' | 'concern' | 'urgent' | 'emergency'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type NotifType =
  | 'new_alert' | 'call_completed' | 'call_summary_ready' | 'medication_reminder'
  | 'system_message' | 'service_booking_update' | 'grief_support_assigned'
  | 'family_nudge' | 'celebration_upcoming' | 'volunteer_matched'
export type NotifSeverity = 'info' | 'concern' | 'urgent' | 'emergency'
export type NotifChannel = 'realtime' | 'sms' | 'email'
export type NotifStatus = 'sent' | 'failed' | 'stub'
export type CheckInFrequency = 'daily' | 'every_other_day' | 'weekly'
export type VolunteerStatus = 'pending' | 'background_check' | 'active' | 'inactive' | 'suspended'
export type VisitType = 'phone_call' | 'in_person_visit' | 'virtual_event' | 'grocery_help' | 'walking_companion' | 'reading_aloud' | 'tech_help'

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          created_at: string
          full_name: string
          preferred_name: string
          date_of_birth: string
          phone_number: string
          preferred_language: string
          preferred_call_time: string | null
          timezone: string
          check_in_frequency: CheckInFrequency
          topics_enjoy: string[]
          topics_avoid: string | null
          lives_alone: boolean | null
          mobility_devices: string[]
          health_conditions: string | null
          medications: string | null
          plan_tier: PlanTier
          status: MemberStatus
          address: string | null
          emergency_contact_1_name: string | null
          emergency_contact_1_phone: string | null
          emergency_contact_1_rel: string | null
          emergency_contact_2_name: string | null
          emergency_contact_2_phone: string | null
          emergency_contact_2_rel: string | null
          doctor_name: string | null
          doctor_phone: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          full_name: string
          preferred_name: string
          date_of_birth: string
          phone_number: string
          preferred_language?: string
          preferred_call_time?: string | null
          timezone?: string
          check_in_frequency?: CheckInFrequency
          topics_enjoy?: string[]
          topics_avoid?: string | null
          lives_alone?: boolean | null
          mobility_devices?: string[]
          health_conditions?: string | null
          medications?: string | null
          plan_tier?: PlanTier
          status?: MemberStatus
          address?: string | null
          emergency_contact_1_name?: string | null
          emergency_contact_1_phone?: string | null
          emergency_contact_1_rel?: string | null
          emergency_contact_2_name?: string | null
          emergency_contact_2_phone?: string | null
          emergency_contact_2_rel?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
        }
        Update: Partial<Database['public']['Tables']['members']['Insert']>
        Relationships: []
      }
      family_members: {
        Row: {
          id: string
          created_at: string
          member_id: string | null
          supabase_auth_id: string
          full_name: string
          email: string
          phone: string | null
          relationship: string | null
          notification_prefs: { sms: boolean; email: boolean; realtime: boolean }
          alert_level: string
          role: UserRole
          last_login_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id?: string | null
          supabase_auth_id: string
          full_name: string
          email: string
          phone?: string | null
          relationship?: string | null
          notification_prefs?: { sms: boolean; email: boolean; realtime: boolean }
          alert_level?: string
          role?: UserRole
          last_login_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['family_members']['Insert']>
        Relationships: [
          { foreignKeyName: 'family_members_member_id_fkey'; columns: ['member_id']; referencedRelation: 'members'; referencedColumns: ['id'] }
        ]
      }
      check_in_calls: {
        Row: {
          id: string
          created_at: string
          member_id: string
          call_type: CallType
          scheduled_at: string | null
          started_at: string | null
          ended_at: string | null
          duration_seconds: number | null
          status: CallStatus
          mood_score: number | null
          energy_score: number | null
          pain_score: number | null
          medication_taken: boolean | null
          transcript: string | null
          ai_summary: string | null
          alert_flags: unknown[]
          recording_url: string | null
          retell_call_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          call_type?: CallType
          scheduled_at?: string | null
          started_at?: string | null
          ended_at?: string | null
          duration_seconds?: number | null
          status?: CallStatus
          mood_score?: number | null
          energy_score?: number | null
          pain_score?: number | null
          medication_taken?: boolean | null
          transcript?: string | null
          ai_summary?: string | null
          alert_flags?: unknown[]
          recording_url?: string | null
          retell_call_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['check_in_calls']['Insert']>
        Relationships: []
      }
      alerts: {
        Row: {
          id: string
          created_at: string
          member_id: string
          alert_type: AlertType
          severity: AlertSeverity
          message: string
          acknowledged: boolean
          acknowledged_by: string | null
          acknowledged_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          alert_type: AlertType
          severity: AlertSeverity
          message: string
          acknowledged?: boolean
          acknowledged_by?: string | null
          acknowledged_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>
        Relationships: []
      }
      care_navigators: {
        Row: {
          id: string
          created_at: string
          supabase_auth_id: string | null
          full_name: string
          email: string
          phone: string | null
          certifications: string[]
          caseload_limit: number
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          supabase_auth_id?: string | null
          full_name: string
          email: string
          phone?: string | null
          certifications?: string[]
          caseload_limit?: number
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['care_navigators']['Insert']>
        Relationships: []
      }
      navigator_assignments: {
        Row: {
          id: string
          created_at: string
          member_id: string
          navigator_id: string
          assigned_at: string
          is_primary: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          navigator_id: string
          assigned_at?: string
          is_primary?: boolean
        }
        Update: Partial<Database['public']['Tables']['navigator_assignments']['Insert']>
        Relationships: []
      }
      navigator_tasks: {
        Row: {
          id: string
          created_at: string
          member_id: string
          navigator_id: string | null
          task_type: string
          description: string
          priority: TaskPriority
          due_by: string | null
          completed: boolean
          completed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          navigator_id?: string | null
          task_type: string
          description: string
          priority?: TaskPriority
          due_by?: string | null
          completed?: boolean
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['navigator_tasks']['Insert']>
        Relationships: []
      }
      navigator_notes: {
        Row: {
          id: string
          created_at: string
          member_id: string
          navigator_id: string
          note: string
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          navigator_id: string
          note: string
        }
        Update: Partial<Database['public']['Tables']['navigator_notes']['Insert']>
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          created_at: string
          member_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan_tier: PlanTier
          status: string
          current_period_start: string | null
          current_period_end: string | null
          monthly_amount_cents: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_tier?: PlanTier
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          monthly_amount_cents?: number | null
        }
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
        Relationships: []
      }
      realtime_notifications: {
        Row: {
          id: string
          created_at: string
          member_id: string
          type: NotifType
          title: string
          body: string
          severity: NotifSeverity
          call_id: string | null
          alert_id: string | null
          read: boolean
          read_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          type: NotifType
          title: string
          body: string
          severity?: NotifSeverity
          call_id?: string | null
          alert_id?: string | null
          read?: boolean
          read_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['realtime_notifications']['Insert']>
        Relationships: []
      }
      notification_log: {
        Row: {
          id: string
          created_at: string
          member_id: string
          family_member_id: string | null
          channel: NotifChannel
          status: NotifStatus
          message_preview: string | null
          error_message: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          family_member_id?: string | null
          channel: NotifChannel
          status: NotifStatus
          message_preview?: string | null
          error_message?: string | null
        }
        Update: Partial<Database['public']['Tables']['notification_log']['Insert']>
        Relationships: []
      }
      emergency_log: {
        Row: {
          id: string
          created_at: string
          member_id: string
          call_id: string | null
          alert_type: string
          triggered_phrase: string | null
          logged_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          call_id?: string | null
          alert_type: string
          triggered_phrase?: string | null
          logged_at?: string
        }
        Update: Partial<Database['public']['Tables']['emergency_log']['Insert']>
        Relationships: []
      }
      medication_schedules: {
        Row: {
          id: string
          created_at: string
          member_id: string
          reminder_time: string
          days_of_week: string[]
          label: string
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          reminder_time: string
          days_of_week?: string[]
          label?: string
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['medication_schedules']['Insert']>
        Relationships: []
      }
      family_task_items: {
        Row: {
          id: string
          created_at: string
          member_id: string
          created_by: string
          assigned_to: string | null
          title: string
          task_type: string
          due_date: string | null
          completed: boolean
          completed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          created_by: string
          assigned_to?: string | null
          title: string
          task_type?: string
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['family_task_items']['Insert']>
        Relationships: []
      }
      family_messages: {
        Row: {
          id: string
          created_at: string
          member_id: string
          sender_id: string
          body: string
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          sender_id: string
          body: string
        }
        Update: Partial<Database['public']['Tables']['family_messages']['Insert']>
        Relationships: []
      }
      document_vault_items: {
        Row: {
          id: string
          created_at: string
          member_id: string
          uploaded_by: string
          file_name: string
          file_type: string
          description: string | null
          storage_path: string
          is_advance_directive: boolean
          last_reviewed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          uploaded_by: string
          file_name: string
          file_type: string
          description?: string | null
          storage_path: string
          is_advance_directive?: boolean
          last_reviewed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['document_vault_items']['Insert']>
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          created_at: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>
        Relationships: []
      }
      volunteers: {
        Row: {
          id: string
          created_at: string
          supabase_auth_id: string | null
          full_name: string
          email: string
          phone: string | null
          city: string | null
          state: string | null
          languages: string[]
          availability_days: string[]
          hours_per_week: string | null
          service_types: VisitType[]
          interests: string[]
          why_volunteer: string | null
          prior_experience: string | null
          status: VolunteerStatus
          background_check_id: string | null
          background_check_status: string | null
          total_hours_logged: number
          total_seniors_helped: number
          rating_average: number | null
          notes: string | null
          has_drivers_license: boolean
          license_state: string | null
          insurance_provider: string | null
          insurance_expiry: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          supabase_auth_id?: string | null
          full_name: string
          email: string
          phone?: string | null
          city?: string | null
          state?: string | null
          languages?: string[]
          availability_days?: string[]
          hours_per_week?: string | null
          service_types?: VisitType[]
          interests?: string[]
          why_volunteer?: string | null
          prior_experience?: string | null
          status?: VolunteerStatus
          background_check_id?: string | null
          background_check_status?: string | null
          total_hours_logged?: number
          total_seniors_helped?: number
          rating_average?: number | null
          notes?: string | null
          has_drivers_license?: boolean
          license_state?: string | null
          insurance_provider?: string | null
          insurance_expiry?: string | null
        }
        Update: Partial<Database['public']['Tables']['volunteers']['Insert']>
        Relationships: []
      }
      volunteer_visits: {
        Row: {
          id: string
          created_at: string
          volunteer_id: string
          member_id: string
          visit_date: string
          duration_minutes: number
          visit_type: VisitType
          volunteer_notes: string | null
          volunteer_rating: number | null
          member_rating: number | null
          verified: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          volunteer_id: string
          member_id: string
          visit_date: string
          duration_minutes: number
          visit_type: VisitType
          volunteer_notes?: string | null
          volunteer_rating?: number | null
          member_rating?: number | null
          verified?: boolean
        }
        Update: Partial<Database['public']['Tables']['volunteer_visits']['Insert']>
        Relationships: []
      }
      volunteer_matches: {
        Row: {
          id: string
          created_at: string
          member_id: string
          volunteer_id: string
          match_score: number
          match_reasons: unknown[]
          status: string
          matched_at: string | null
          intro_sent_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          volunteer_id: string
          match_score?: number
          match_reasons?: unknown[]
          status?: string
          matched_at?: string | null
          intro_sent_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['volunteer_matches']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      plan_tier: PlanTier
      member_status: MemberStatus
      user_role: UserRole
      call_status: CallStatus
      call_type: CallType
      alert_type: AlertType
      alert_severity: AlertSeverity
      task_priority: TaskPriority
      notif_type: NotifType
      notif_severity: NotifSeverity
      notif_channel: NotifChannel
      notif_status: NotifStatus
      check_in_frequency: CheckInFrequency
      volunteer_status: VolunteerStatus
      visit_type: VisitType
    }
    CompositeTypes: Record<string, never>
  }
}
