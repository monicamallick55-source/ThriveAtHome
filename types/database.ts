// Supabase database type definitions — matches the schema in supabase/migrations/001_initial_schema.sql.
// Generated manually from the migration file. Keep in sync when schema changes.

export type PlanTier = 'basics' | 'connect' | 'complete' | 'premier'
export type MemberStatus = 'active' | 'inactive' | 'paused'
export type UserRole = 'family' | 'navigator' | 'admin' | 'volunteer' | 'student' | 'university_admin' | 'employer_admin' | 'agency_admin' | 'aaa_admin' | 'org_admin' | 'senior_center_admin' | 'network_admin'
export type CallStatus = 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'failed'
export type CallType =
  | 'check_in' | 'concierge' | 'navigator' | 'onboarding'
  | 'callback' | 'celebration' | 'reminder' | 'crisis' | 'care_line'
export type CallDirection = 'inbound' | 'outbound'
export type AlertType = 'missed_call' | 'mood_drop' | 'medication_miss' | 'wellness_drift' | 'fall' | 'crisis' | 'emergency'
export type AlertSeverity = 'informational' | 'concern' | 'urgent' | 'emergency'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type NotifType =
  | 'new_alert' | 'call_completed' | 'call_summary_ready' | 'medication_reminder'
  | 'system_message' | 'service_booking_update' | 'grief_support_assigned'
  | 'family_nudge' | 'celebration_upcoming' | 'volunteer_matched'
  | 'important_date_reminder'
  | 'automation_isolation' | 'automation_vaccination' | 'automation_volunteer_reengagement'
  | 'automation_event_noshow' | 'automation_onboarding' | 'automation_transport_followup'
  | 'automation_tech_help_check' | 'automation_meal_feedback'
export type NotifSeverity = 'info' | 'concern' | 'urgent' | 'emergency'
export type NotifChannel = 'realtime' | 'sms' | 'email'
export type NotifStatus = 'sent' | 'failed' | 'stub'
export type CheckInFrequency = 'daily' | 'every_other_day' | 'weekly'
export type VolunteerStatus = 'pending' | 'background_check' | 'active' | 'inactive' | 'suspended'
export type VisitType = 'phone_call' | 'in_person_visit' | 'virtual_event' | 'grocery_help' | 'walking_companion' | 'reading_aloud' | 'tech_help'
export type EventFormat = 'phone_only' | 'video_or_phone' | 'in_person'
export type EventStatus = 'upcoming' | 'live' | 'completed' | 'cancelled'
export type BookingStatus = 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
export type AddonBilling = 'monthly' | 'one_time'
export type AddonPurchaseStatus = 'active' | 'pending' | 'fulfilled' | 'cancelled' | 'expired'

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
          buddy_match_topics: string[] | null
          buddy_match_era: string | null
          buddy_call_length_preference: string | null
          buddy_intro_note: string | null
          grief_welcome_path: boolean
          grief_enrolled_at: string | null
          grief_loss_type: string | null
          zip_code: string | null
          faith_preference: string | null
          device_integration_consent: boolean
          ml_insights_opt_out: boolean
          supabase_auth_id: string | null
          aria_call_opted_in: boolean
          call_frequency_preference: 'daily' | 'few_times_week' | 'weekly'
          onboarding_call_completed: boolean
          last_aria_call_at: string | null
          family_can_see_mood: boolean
          family_can_see_call_summaries: boolean
          family_can_see_service_history: boolean
          family_can_see_alerts: boolean
          preferred_contact_method: string
          directory_opt_in: boolean
          directory_bio: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          full_name: string
          preferred_name: string
          date_of_birth: string
          phone_number: string
          supabase_auth_id?: string | null
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
          buddy_match_topics?: string[] | null
          buddy_match_era?: string | null
          buddy_call_length_preference?: string | null
          buddy_intro_note?: string | null
          grief_welcome_path?: boolean
          grief_enrolled_at?: string | null
          grief_loss_type?: string | null
          zip_code?: string | null
          faith_preference?: string | null
          device_integration_consent?: boolean
          ml_insights_opt_out?: boolean
          aria_call_opted_in?: boolean
          call_frequency_preference?: 'daily' | 'few_times_week' | 'weekly'
          onboarding_call_completed?: boolean
          last_aria_call_at?: string | null
          family_can_see_mood?: boolean
          family_can_see_call_summaries?: boolean
          family_can_see_service_history?: boolean
          family_can_see_alerts?: boolean
          preferred_contact_method?: string
          directory_opt_in?: boolean
          directory_bio?: string | null
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
          university_name: string | null
          employer_account_id: string | null
          agency_id: string | null
          org_id: string | null
          network_id: string | null
          senior_center_id: string | null
          aaa_id: string | null
          referring_agency_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id?: string | null
          supabase_auth_id?: string
          full_name: string
          email: string
          phone?: string | null
          relationship?: string | null
          notification_prefs?: { sms: boolean; email: boolean; realtime: boolean }
          alert_level?: string
          role?: UserRole
          last_login_at?: string | null
          university_name?: string | null
          employer_account_id?: string | null
          agency_id?: string | null
          org_id?: string | null
          network_id?: string | null
          senior_center_id?: string | null
          aaa_id?: string | null
          referring_agency_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['family_members']['Insert']>
        Relationships: [
          { foreignKeyName: 'family_members_member_id_fkey'; columns: ['member_id']; referencedRelation: 'members'; referencedColumns: ['id'] }
        ]
      }
      employer_invitations: {
        Row: {
          id: string
          created_at: string
          employer_account_id: string
          invited_by_auth_id: string
          email: string
          token: string
          status: string
          expires_at: string
          accepted_at: string | null
          accepted_by_auth_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          employer_account_id: string
          invited_by_auth_id: string
          email: string
          token: string
          status?: string
          expires_at?: string
          accepted_at?: string | null
          accepted_by_auth_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['employer_invitations']['Insert']>
        Relationships: [
          { foreignKeyName: 'employer_invitations_employer_account_id_fkey'; columns: ['employer_account_id']; referencedRelation: 'employer_accounts'; referencedColumns: ['id'] }
        ]
      }
      check_in_calls: {
        Row: {
          id: string
          created_at: string
          member_id: string | null
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
          pain_mentioned: boolean | null
          medication_adherence: boolean | null
          social_isolation_signal: boolean | null
          fall_risk_mention: boolean | null
          cognitive_concern_signal: boolean | null
          agent_id: string | null
          agent_name: string | null
          direction: CallDirection | null
          from_number: string | null
          to_number: string | null
          caller_role: string | null
          processed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id?: string | null
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
          pain_mentioned?: boolean | null
          medication_adherence?: boolean | null
          social_isolation_signal?: boolean | null
          fall_risk_mention?: boolean | null
          cognitive_concern_signal?: boolean | null
          agent_id?: string | null
          agent_name?: string | null
          direction?: CallDirection | null
          from_number?: string | null
          to_number?: string | null
          caller_role?: string | null
          processed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['check_in_calls']['Insert']>
        Relationships: []
      }
      inbound_call_log: {
        Row: {
          id: string
          created_at: string
          retell_call_id: string | null
          agent_name: string
          from_number: string | null
          caller_role: string
          family_member_id: string | null
          volunteer_id: string | null
          duration_seconds: number | null
          ai_summary: string | null
          transcript: string | null
          needs_followup: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          retell_call_id?: string | null
          agent_name: string
          from_number?: string | null
          caller_role?: string
          family_member_id?: string | null
          volunteer_id?: string | null
          duration_seconds?: number | null
          ai_summary?: string | null
          transcript?: string | null
          needs_followup?: boolean
        }
        Update: Partial<Database['public']['Tables']['inbound_call_log']['Insert']>
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
          icd10_codes: string[]
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
          icd10_codes?: string[]
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
          doc_category: string
          expires_on: string | null
          shared_with_navigator: boolean
          issuer: string | null
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
          doc_category?: string
          expires_on?: string | null
          shared_with_navigator?: boolean
          issuer?: string | null
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
          corporate_program_id: string | null
          volunteer_specialty: string | null
          professional_background: string | null
          faith_affiliation: string | null
          is_chaplain: boolean
          is_neighbor_volunteer: boolean
          is_family_reciprocal: boolean
          zip_code: string | null
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
          corporate_program_id?: string | null
          volunteer_specialty?: string | null
          professional_background?: string | null
          faith_affiliation?: string | null
          is_chaplain?: boolean
          is_neighbor_volunteer?: boolean
          is_family_reciprocal?: boolean
          zip_code?: string | null
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
      student_visits: {
        Row: {
          id: string
          created_at: string
          student_id: string
          visit_date: string
          duration_minutes: number
          visit_type: string
          reflection: string
          notes: string | null
          verified: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          student_id: string
          visit_date: string
          duration_minutes: number
          visit_type?: string
          reflection: string
          notes?: string | null
          verified?: boolean
        }
        Update: Partial<Database['public']['Tables']['student_visits']['Insert']>
        Relationships: []
      }
      student_volunteers: {
        Row: {
          id: string
          created_at: string
          supabase_auth_id: string | null
          full_name: string
          email: string
          university_name: string | null
          major: string | null
          graduation_year: number | null
          interests: string[]
          languages: string[]
          total_hours_logged: number
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          supabase_auth_id?: string | null
          full_name: string
          email: string
          university_name?: string | null
          major?: string | null
          graduation_year?: number | null
          interests?: string[]
          languages?: string[]
          total_hours_logged?: number
          status?: string
        }
        Update: Partial<Database['public']['Tables']['student_volunteers']['Insert']>
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
      cultural_circles: {
        Row: {
          id: string
          created_at: string
          circle_name: string
          primary_language: string
          description: string
          member_count: number
          is_active: boolean
          image_placeholder: string | null
          interest_tag: string | null
          community_type: string
        }
        Insert: {
          id?: string
          created_at?: string
          circle_name: string
          primary_language?: string
          description: string
          member_count?: number
          is_active?: boolean
          image_placeholder?: string | null
          interest_tag?: string | null
          community_type?: string
        }
        Update: Partial<Database['public']['Tables']['cultural_circles']['Insert']>
        Relationships: []
      }
      circle_memberships: {
        Row: {
          id: string
          created_at: string
          member_id: string
          circle_id: string
          joined_at: string
          is_ambassador: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          circle_id: string
          joined_at?: string
          is_ambassador?: boolean
        }
        Update: Partial<Database['public']['Tables']['circle_memberships']['Insert']>
        Relationships: []
      }
      circle_posts: {
        Row: {
          id: string
          created_at: string
          circle_id: string
          member_id: string
          content: string
          post_type: string
        }
        Insert: {
          id?: string
          created_at?: string
          circle_id: string
          member_id: string
          content: string
          post_type?: string
        }
        Update: Partial<Database['public']['Tables']['circle_posts']['Insert']>
        Relationships: []
      }
      circle_events: {
        Row: {
          id: string
          created_at: string
          circle_id: string | null
          circle_ids: string[]
          title: string
          description: string | null
          event_date: string
          event_time: string | null
          format: string
          dial_in_number: string | null
          dial_in_code: string | null
          video_link: string | null
          location_address: string | null
          rsvp_count: number
          is_recurring: boolean
          is_platform_wide: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          circle_id?: string | null
          circle_ids?: string[]
          title: string
          description?: string | null
          event_date: string
          event_time?: string | null
          format?: string
          dial_in_number?: string | null
          dial_in_code?: string | null
          video_link?: string | null
          location_address?: string | null
          rsvp_count?: number
          is_recurring?: boolean
          is_platform_wide?: boolean
        }
        Update: Partial<Database['public']['Tables']['circle_events']['Insert']>
        Relationships: []
      }
      events: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          event_type: string
          host_name: string | null
          event_date: string
          event_time: string
          timezone: string
          duration_minutes: number
          format: EventFormat
          dial_in_number: string | null
          dial_in_code: string | null
          video_link: string | null
          location_address: string | null
          max_capacity: number | null
          is_recurring: boolean
          recurrence_pattern: string | null
          status: EventStatus
          rsvp_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          event_type?: string
          host_name?: string | null
          event_date: string
          event_time: string
          timezone?: string
          duration_minutes?: number
          format?: EventFormat
          dial_in_number?: string | null
          dial_in_code?: string | null
          video_link?: string | null
          location_address?: string | null
          max_capacity?: number | null
          is_recurring?: boolean
          recurrence_pattern?: string | null
          status?: EventStatus
          rsvp_count?: number
        }
        Update: Partial<Database['public']['Tables']['events']['Insert']>
        Relationships: []
      }
      event_rsvps: {
        Row: {
          id: string
          created_at: string
          event_id: string
          member_id: string
          rsvp_date: string
          attended: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          event_id: string
          member_id: string
          rsvp_date?: string
          attended?: boolean
        }
        Update: Partial<Database['public']['Tables']['event_rsvps']['Insert']>
        Relationships: []
      }
      circle_event_rsvps: {
        Row: {
          id: string
          created_at: string
          event_id: string
          member_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          event_id: string
          member_id: string
        }
        Update: Partial<Database['public']['Tables']['circle_event_rsvps']['Insert']>
        Relationships: []
      }
      skills_offered: {
        Row: {
          id: string
          created_at: string
          member_id: string
          skill_name: string
          skill_category: string
          description: string
          delivery_method: string
          max_group_size: number
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          skill_name: string
          skill_category?: string
          description: string
          delivery_method?: string
          max_group_size?: number
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['skills_offered']['Insert']>
        Relationships: []
      }
      time_credits: {
        Row: {
          id: string
          member_id: string
          balance: number
          lifetime_earned: number
          lifetime_spent: number
        }
        Insert: {
          id?: string
          member_id: string
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
        }
        Update: Partial<Database['public']['Tables']['time_credits']['Insert']>
        Relationships: []
      }
      skill_exchanges: {
        Row: {
          id: string
          created_at: string
          teacher_member_id: string
          learner_member_id: string
          skill_id: string
          scheduled_date: string | null
          duration_hours: number
          status: string
          teacher_rating: number | null
          learner_rating: number | null
          credits_transferred: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          teacher_member_id: string
          learner_member_id: string
          skill_id: string
          scheduled_date?: string | null
          duration_hours?: number
          status?: string
          teacher_rating?: number | null
          learner_rating?: number | null
          credits_transferred?: number | null
        }
        Update: Partial<Database['public']['Tables']['skill_exchanges']['Insert']>
        Relationships: []
      }
      time_credit_transactions: {
        Row: {
          id: string
          created_at: string
          member_id: string
          amount: number
          type: string
          exchange_id: string | null
          description: string
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          amount: number
          type: string
          exchange_id?: string | null
          description: string
        }
        Update: Partial<Database['public']['Tables']['time_credit_transactions']['Insert']>
        Relationships: []
      }
      employer_accounts: {
        Row: {
          id: string
          created_at: string
          company_name: string
          contact_name: string
          contact_email: string
          plan_tier: string
          seats_purchased: number
          seats_used: number
          status: string
          pepm_price_cents: number
          billing_cycle: string
          billing_start_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          company_name: string
          contact_name: string
          contact_email: string
          plan_tier?: string
          seats_purchased?: number
          seats_used?: number
          status?: string
          pepm_price_cents?: number
          billing_cycle?: string
          billing_start_date?: string | null
        }
        Update: Partial<Database['public']['Tables']['employer_accounts']['Insert']>
        Relationships: []
      }
      employer_leads: {
        Row: {
          id: string
          created_at: string
          company_name: string
          contact_name: string
          email: string
          phone: string | null
          company_size: string | null
          notes: string | null
          status: string
          next_follow_up_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          company_name: string
          contact_name: string
          email: string
          phone?: string | null
          company_size?: string | null
          notes?: string | null
          status?: string
          next_follow_up_date?: string | null
        }
        Update: Partial<Database['public']['Tables']['employer_leads']['Insert']>
        Relationships: []
      }
      partner_api_keys: {
        Row: {
          id: string
          created_at: string
          employer_account_id: string
          key_name: string
          api_key: string
          is_active: boolean
          requests_today: number
          requests_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          employer_account_id: string
          key_name?: string
          api_key: string
          is_active?: boolean
          requests_today?: number
          requests_date?: string | null
        }
        Update: Partial<Database['public']['Tables']['partner_api_keys']['Insert']>
        Relationships: [
          { foreignKeyName: 'partner_api_keys_employer_account_id_fkey'; columns: ['employer_account_id']; referencedRelation: 'employer_accounts'; referencedColumns: ['id'] }
        ]
      }
      celebration_events: {
        Row: {
          id: string
          created_at: string
          member_id: string
          celebration_type: string
          event_date: string
          status: string
          ai_message: string | null
          family_notified_at: string | null
          community_posted_at: string | null
          pet_id: string | null
          pet_name: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          celebration_type: string
          event_date: string
          status?: string
          ai_message?: string | null
          family_notified_at?: string | null
          community_posted_at?: string | null
          pet_id?: string | null
          pet_name?: string | null
        }
        Update: Partial<Database['public']['Tables']['celebration_events']['Insert']>
        Relationships: []
      }
      life_story_entries: {
        Row: {
          id: string
          created_at: string
          member_id: string
          title: string
          content: string
          era: string | null
          entry_type: string
          created_by: string | null
          is_private: boolean
          attachments: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          title: string
          content: string
          era?: string | null
          entry_type?: string
          created_by?: string | null
          is_private?: boolean
          attachments?: string[]
        }
        Update: Partial<Database['public']['Tables']['life_story_entries']['Insert']>
        Relationships: [
          { foreignKeyName: 'life_story_entries_member_id_fkey'; columns: ['member_id']; referencedRelation: 'members'; referencedColumns: ['id'] }
        ]
      }
      memory_books: {
        Row: {
          id: string
          created_at: string
          member_id: string
          title: string
          dedication: string | null
          layout_style: string
          format_type: string
          entry_ids: string[]
          cover_photo_path: string | null
          storage_path: string | null
          collage_storage_path: string | null
          page_count: number | null
          status: string
          purchase_date: string | null
          regeneration_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          title?: string
          dedication?: string | null
          layout_style?: string
          format_type?: string
          entry_ids?: string[]
          cover_photo_path?: string | null
          storage_path?: string | null
          collage_storage_path?: string | null
          page_count?: number | null
          status?: string
          purchase_date?: string | null
          regeneration_count?: number
        }
        Update: Partial<Database['public']['Tables']['memory_books']['Insert']>
        Relationships: [
          { foreignKeyName: 'memory_books_member_id_fkey'; columns: ['member_id']; referencedRelation: 'members'; referencedColumns: ['id'] }
        ]
      }
      service_bookings: {
        Row: {
          id: string
          created_at: string
          member_id: string
          service_type: string
          provider_name: string | null
          booking_details: Record<string, unknown>
          status: BookingStatus
          requested_for: string | null
          confirmed_at: string | null
          completed_at: string | null
          provider_booking_id: string | null
          cost_estimate: number | null
          notes: string | null
          volunteer_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          service_type: string
          provider_name?: string | null
          booking_details?: Record<string, unknown>
          status?: BookingStatus
          requested_for?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
          provider_booking_id?: string | null
          cost_estimate?: number | null
          notes?: string | null
          volunteer_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['service_bookings']['Insert']>
        Relationships: [
          { foreignKeyName: 'service_bookings_member_id_fkey'; columns: ['member_id']; referencedRelation: 'members'; referencedColumns: ['id'] }
        ]
      }
      service_providers: {
        Row: {
          id: string
          created_at: string
          full_name: string
          company_name: string | null
          phone: string | null
          email: string | null
          service_types: string[]
          city: string | null
          state: string | null
          is_active: boolean
          rating_average: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          full_name: string
          company_name?: string | null
          phone?: string | null
          email?: string | null
          service_types?: string[]
          city?: string | null
          state?: string | null
          is_active?: boolean
          rating_average?: number | null
        }
        Update: Partial<Database['public']['Tables']['service_providers']['Insert']>
        Relationships: []
      }
      grief_support_requests: {
        Row: {
          id: string
          created_at: string
          member_id: string
          loss_type: string
          circle_type_requested: string | null
          availability_preference: string | null
          additional_notes: string | null
          status: string
          navigator_notes: string | null
          matched_at: string | null
          loss_anniversary_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          loss_type: string
          circle_type_requested?: string | null
          availability_preference?: string | null
          additional_notes?: string | null
          status?: string
          navigator_notes?: string | null
          matched_at?: string | null
          loss_anniversary_date?: string | null
        }
        Update: Partial<Database['public']['Tables']['grief_support_requests']['Insert']>
        Relationships: [
          { foreignKeyName: 'grief_support_requests_member_id_fkey'; columns: ['member_id']; referencedRelation: 'members'; referencedColumns: ['id'] }
        ]
      }
      tracked_items: {
        Row: {
          id: string
          created_at: string
          member_id: string
          item_type: string
          category: string
          subcategory: string | null
          preferred_contact_method: string | null
          item_name: string
          expiration_or_appointment_date: string
          reminder_lead_days: number
          recurrence_cycle_days: number | null
          is_recurring: boolean
          renewal_contact_info: string | null
          attachments: string[]
          status: string
          last_reminded_at: string | null
          snoozed_until: string | null
          notes: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          item_type?: string
          category?: string
          subcategory?: string | null
          preferred_contact_method?: string | null
          item_name: string
          expiration_or_appointment_date: string
          reminder_lead_days?: number
          recurrence_cycle_days?: number | null
          is_recurring?: boolean
          renewal_contact_info?: string | null
          attachments?: string[]
          status?: string
          last_reminded_at?: string | null
          snoozed_until?: string | null
          notes?: string | null
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['tracked_items']['Insert']>
        Relationships: [
          { foreignKeyName: 'tracked_items_member_id_fkey'; columns: ['member_id']; referencedRelation: 'members'; referencedColumns: ['id'] }
        ]
      }
      corporate_volunteer_programs: {
        Row: {
          id: string
          created_at: string
          employer_account_id: string
          program_name: string
          matching_rate_per_hour: number
          annual_hour_cap_per_employee: number | null
          total_hours_logged: number
          total_matched_value: number
          integration_type: string
          package_type: string
          tier: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          employer_account_id: string
          program_name: string
          matching_rate_per_hour?: number
          annual_hour_cap_per_employee?: number | null
          total_hours_logged?: number
          total_matched_value?: number
          integration_type?: string
          package_type?: string
          tier?: string
          status?: string
        }
        Update: Partial<Database['public']['Tables']['corporate_volunteer_programs']['Insert']>
        Relationships: [
          { foreignKeyName: 'corporate_volunteer_programs_employer_account_id_fkey'; columns: ['employer_account_id']; referencedRelation: 'employer_accounts'; referencedColumns: ['id'] }
        ]
      }
      corporate_volunteer_hours: {
        Row: {
          id: string
          created_at: string
          corporate_program_id: string
          volunteer_id: string
          visit_id: string | null
          hours_logged: number
          logged_date: string
          verified: boolean
          verified_by: string | null
          export_status: string
        }
        Insert: {
          id?: string
          created_at?: string
          corporate_program_id: string
          volunteer_id: string
          visit_id?: string | null
          hours_logged: number
          logged_date: string
          verified?: boolean
          verified_by?: string | null
          export_status?: string
        }
        Update: Partial<Database['public']['Tables']['corporate_volunteer_hours']['Insert']>
        Relationships: [
          { foreignKeyName: 'corporate_volunteer_hours_corporate_program_id_fkey'; columns: ['corporate_program_id']; referencedRelation: 'corporate_volunteer_programs'; referencedColumns: ['id'] },
          { foreignKeyName: 'corporate_volunteer_hours_volunteer_id_fkey'; columns: ['volunteer_id']; referencedRelation: 'volunteers'; referencedColumns: ['id'] }
        ]
      }
      k12_schools: {
        Row: {
          id: string
          created_at: string
          school_name: string
          contact_name: string
          contact_email: string
          school_type: string
          grade_levels: string[]
          city: string | null
          state: string | null
          program_types: string[]
          active_student_count: number
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          school_name: string
          contact_name: string
          contact_email: string
          school_type?: string
          grade_levels?: string[]
          city?: string | null
          state?: string | null
          program_types?: string[]
          active_student_count?: number
          status?: string
        }
        Update: Partial<Database['public']['Tables']['k12_schools']['Insert']>
        Relationships: []
      }
      k12_student_volunteers: {
        Row: {
          id: string
          created_at: string
          school_id: string
          student_name: string
          grade_level: string | null
          program_type: string
          member_id: string | null
          total_hours_logged: number
          sessions_completed: number
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          school_id: string
          student_name: string
          grade_level?: string | null
          program_type?: string
          member_id?: string | null
          total_hours_logged?: number
          sessions_completed?: number
          status?: string
        }
        Update: Partial<Database['public']['Tables']['k12_student_volunteers']['Insert']>
        Relationships: []
      }
      member_ambassadors: {
        Row: {
          id: string
          created_at: string
          member_id: string
          nominated_by: string | null
          status: string
          ambassador_since: string
          specialties: string[]
          total_new_members_welcomed: number
          total_events_hosted: number
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          nominated_by?: string | null
          status?: string
          ambassador_since?: string
          specialties?: string[]
          total_new_members_welcomed?: number
          total_events_hosted?: number
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['member_ambassadors']['Insert']>
        Relationships: []
      }
      family_volunteer_links: {
        Row: {
          id: string
          created_at: string
          volunteer_id: string
          family_member_id: string
          linked_member_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          volunteer_id: string
          family_member_id: string
          linked_member_id: string
        }
        Update: Partial<Database['public']['Tables']['family_volunteer_links']['Insert']>
        Relationships: []
      }
      member_devices: {
        Row: {
          id: string
          created_at: string
          member_id: string
          device_category: string
          device_type: string
          device_name: string | null
          provider: string | null
          status: string
          billing_option: string
          external_account_id: string | null
          last_sync_at: string | null
          settings: Record<string, unknown>
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          device_category?: string
          device_type: string
          device_name?: string | null
          provider?: string | null
          status?: string
          billing_option?: string
          external_account_id?: string | null
          last_sync_at?: string | null
          settings?: Record<string, unknown>
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['member_devices']['Insert']>
        Relationships: [
          { foreignKeyName: 'member_devices_member_id_fkey'; columns: ['member_id']; referencedRelation: 'members'; referencedColumns: ['id'] }
        ]
      }
      device_signals: {
        Row: {
          id: string
          created_at: string
          member_id: string
          device_id: string | null
          signal_type: string
          signal_value: Record<string, unknown>
          occurred_at: string
          processed: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          device_id?: string | null
          signal_type: string
          signal_value?: Record<string, unknown>
          occurred_at?: string
          processed?: boolean
        }
        Update: Partial<Database['public']['Tables']['device_signals']['Insert']>
        Relationships: []
      }
      wearable_connections: {
        Row: {
          id: string
          created_at: string
          member_id: string
          platform: string
          external_user_id: string | null
          scopes: string[]
          status: string
          connected_at: string | null
          last_sync_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          platform: string
          external_user_id?: string | null
          scopes?: string[]
          status?: string
          connected_at?: string | null
          last_sync_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['wearable_connections']['Insert']>
        Relationships: []
      }
      wearable_readings: {
        Row: {
          id: string
          created_at: string
          member_id: string
          connection_id: string | null
          reading_date: string
          steps: number | null
          resting_heart_rate: number | null
          sleep_hours: number | null
          active_minutes: number | null
          fall_detected: boolean
          source_platform: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          connection_id?: string | null
          reading_date: string
          steps?: number | null
          resting_heart_rate?: number | null
          sleep_hours?: number | null
          active_minutes?: number | null
          fall_detected?: boolean
          source_platform?: string | null
        }
        Update: Partial<Database['public']['Tables']['wearable_readings']['Insert']>
        Relationships: []
      }
      fall_events: {
        Row: {
          id: string
          created_at: string
          member_id: string
          device_id: string | null
          source: string
          confidence: number | null
          detected_at: string
          resolved: boolean
          resolved_at: string | null
          resolution_note: string | null
          alert_id: string | null
          navigator_task_id: string | null
          raw: Record<string, unknown>
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          device_id?: string | null
          source?: string
          confidence?: number | null
          detected_at?: string
          resolved?: boolean
          resolved_at?: string | null
          resolution_note?: string | null
          alert_id?: string | null
          navigator_task_id?: string | null
          raw?: Record<string, unknown>
        }
        Update: Partial<Database['public']['Tables']['fall_events']['Insert']>
        Relationships: []
      }
      ehr_connections: {
        Row: {
          id: string
          created_at: string
          member_id: string
          ehr_system: string
          fhir_base_url: string | null
          patient_fhir_id: string | null
          status: string
          consent_granted_at: string | null
          last_export_at: string | null
          scopes: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          ehr_system?: string
          fhir_base_url?: string | null
          patient_fhir_id?: string | null
          status?: string
          consent_granted_at?: string | null
          last_export_at?: string | null
          scopes?: string[]
        }
        Update: Partial<Database['public']['Tables']['ehr_connections']['Insert']>
        Relationships: []
      }
      fhir_export_log: {
        Row: {
          id: string
          created_at: string
          member_id: string
          connection_id: string | null
          resource_type: string
          resource_count: number
          export_status: string
          payload_summary: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          connection_id?: string | null
          resource_type: string
          resource_count?: number
          export_status?: string
          payload_summary?: string | null
        }
        Update: Partial<Database['public']['Tables']['fhir_export_log']['Insert']>
        Relationships: []
      }
      wellness_baselines: {
        Row: {
          id: string
          created_at: string
          member_id: string
          window_days: number
          computed_at: string
          data_points: number
          status: string
          mood_mean: number | null
          mood_std: number | null
          energy_mean: number | null
          energy_std: number | null
          pain_mean: number | null
          pain_std: number | null
          sleep_hours_mean: number | null
          sleep_hours_std: number | null
          steps_mean: number | null
          steps_std: number | null
          resting_hr_mean: number | null
          resting_hr_std: number | null
          call_engagement_rate: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          window_days?: number
          computed_at?: string
          data_points?: number
          status?: string
          mood_mean?: number | null
          mood_std?: number | null
          energy_mean?: number | null
          energy_std?: number | null
          pain_mean?: number | null
          pain_std?: number | null
          sleep_hours_mean?: number | null
          sleep_hours_std?: number | null
          steps_mean?: number | null
          steps_std?: number | null
          resting_hr_mean?: number | null
          resting_hr_std?: number | null
          call_engagement_rate?: number | null
        }
        Update: Partial<Database['public']['Tables']['wellness_baselines']['Insert']>
        Relationships: []
      }
      behavioral_anomalies: {
        Row: {
          id: string
          created_at: string
          member_id: string
          detected_at: string
          method: string
          anomaly_score: number
          severity: string
          top_drivers: string[]
          features: Record<string, unknown>
          alert_id: string | null
          navigator_task_id: string | null
          resolved: boolean
          resolved_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          detected_at?: string
          method?: string
          anomaly_score?: number
          severity?: string
          top_drivers?: string[]
          features?: Record<string, unknown>
          alert_id?: string | null
          navigator_task_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['behavioral_anomalies']['Insert']>
        Relationships: []
      }
      fall_risk_scores: {
        Row: {
          id: string
          created_at: string
          member_id: string
          computed_at: string
          model: string
          risk_probability: number
          risk_band: string
          contributing_factors: unknown
          navigator_task_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          computed_at?: string
          model?: string
          risk_probability?: number
          risk_band?: string
          contributing_factors?: unknown
          navigator_task_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['fall_risk_scores']['Insert']>
        Relationships: []
      }
      isolation_scores: {
        Row: {
          id: string
          created_at: string
          member_id: string
          computed_at: string
          isolation_score: number
          risk_band: string
          sentiment_valence: number | null
          engagement_trend: number | null
          drivers: string[]
          suggested_connections: unknown
          navigator_task_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          computed_at?: string
          isolation_score?: number
          risk_band?: string
          sentiment_valence?: number | null
          engagement_trend?: number | null
          drivers?: string[]
          suggested_connections?: unknown
          navigator_task_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['isolation_scores']['Insert']>
        Relationships: []
      }
      grief_pattern_flags: {
        Row: {
          id: string
          created_at: string
          member_id: string
          grief_request_id: string | null
          computed_at: string
          months_since_loss: number | null
          pgd_risk: boolean
          risk_band: string
          indicators: string[]
          professional_referral_suggested: boolean
          navigator_task_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          grief_request_id?: string | null
          computed_at?: string
          months_since_loss?: number | null
          pgd_risk?: boolean
          risk_band?: string
          indicators?: string[]
          professional_referral_suggested?: boolean
          navigator_task_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['grief_pattern_flags']['Insert']>
        Relationships: []
      }
      trusted_advisors: {
        Row: {
          id: string
          created_at: string
          full_name: string
          firm_name: string | null
          advisor_type: string
          bio: string | null
          credentials: string[]
          languages: string[]
          service_states: string[]
          service_metros: string[]
          city: string | null
          state: string | null
          phone: string | null
          email: string | null
          website: string | null
          headshot_path: string | null
          accepts_new_clients: boolean
          offers_free_consult: boolean
          sliding_scale: boolean
          listing_tier: string
          listing_fee_annual: number
          listing_status: string
          listing_started_at: string | null
          listing_expires_at: string | null
          vetted_at: string | null
          vetted_by: string | null
          thrive_verified: boolean
          avg_rating: number | null
          total_reviews: number
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          full_name: string
          firm_name?: string | null
          advisor_type: string
          bio?: string | null
          credentials?: string[]
          languages?: string[]
          service_states?: string[]
          service_metros?: string[]
          city?: string | null
          state?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          headshot_path?: string | null
          accepts_new_clients?: boolean
          offers_free_consult?: boolean
          sliding_scale?: boolean
          listing_tier?: string
          listing_fee_annual?: number
          listing_status?: string
          listing_started_at?: string | null
          listing_expires_at?: string | null
          vetted_at?: string | null
          vetted_by?: string | null
          thrive_verified?: boolean
          avg_rating?: number | null
          total_reviews?: number
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['trusted_advisors']['Insert']>
        Relationships: []
      }
      advisor_listing_applications: {
        Row: {
          id: string
          created_at: string
          full_name: string
          firm_name: string | null
          advisor_type: string
          email: string
          phone: string | null
          credentials: string | null
          service_areas: string | null
          years_experience: string | null
          requested_tier: string
          message: string | null
          status: string
          reviewed_at: string | null
          reviewed_by: string | null
          review_notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          full_name: string
          firm_name?: string | null
          advisor_type: string
          email: string
          phone?: string | null
          credentials?: string | null
          service_areas?: string | null
          years_experience?: string | null
          requested_tier?: string
          message?: string | null
          status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          review_notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['advisor_listing_applications']['Insert']>
        Relationships: []
      }
      advisor_connections: {
        Row: {
          id: string
          created_at: string
          member_id: string
          advisor_id: string
          requested_by: string | null
          status: string
          topic: string | null
          member_note: string | null
          navigator_id: string | null
          navigator_note: string | null
          introduced_at: string | null
          navigator_task_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          advisor_id: string
          requested_by?: string | null
          status?: string
          topic?: string | null
          member_note?: string | null
          navigator_id?: string | null
          navigator_note?: string | null
          introduced_at?: string | null
          navigator_task_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['advisor_connections']['Insert']>
        Relationships: []
      }
      advisor_reviews: {
        Row: {
          id: string
          created_at: string
          advisor_id: string
          member_id: string
          connection_id: string | null
          rating: number
          review_text: string | null
          is_published: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          advisor_id: string
          member_id: string
          connection_id?: string | null
          rating: number
          review_text?: string | null
          is_published?: boolean
        }
        Update: Partial<Database['public']['Tables']['advisor_reviews']['Insert']>
        Relationships: []
      }
      vita_sites: {
        Row: {
          id: string
          created_at: string
          site_name: string
          host_org: string | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          phone: string | null
          languages: string[]
          appointment_required: boolean
          drop_off_available: boolean
          virtual_available: boolean
          hours_note: string | null
          season_start: string | null
          season_end: string | null
          program_type: string
          is_active: boolean
          source: string
          external_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          site_name: string
          host_org?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          phone?: string | null
          languages?: string[]
          appointment_required?: boolean
          drop_off_available?: boolean
          virtual_available?: boolean
          hours_note?: string | null
          season_start?: string | null
          season_end?: string | null
          program_type?: string
          is_active?: boolean
          source?: string
          external_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['vita_sites']['Insert']>
        Relationships: []
      }
      vita_appointments: {
        Row: {
          id: string
          created_at: string
          member_id: string
          requested_by: string | null
          vita_site_id: string | null
          tax_year: number
          filing_situation: string | null
          estimated_income_band: string | null
          needs_transport: boolean
          needs_language_support: string | null
          preferred_dates: string | null
          status: string
          scheduled_for: string | null
          navigator_id: string | null
          navigator_note: string | null
          navigator_task_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          requested_by?: string | null
          vita_site_id?: string | null
          tax_year: number
          filing_situation?: string | null
          estimated_income_band?: string | null
          needs_transport?: boolean
          needs_language_support?: string | null
          preferred_dates?: string | null
          status?: string
          scheduled_for?: string | null
          navigator_id?: string | null
          navigator_note?: string | null
          navigator_task_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['vita_appointments']['Insert']>
        Relationships: []
      }
      crisis_resource_views: {
        Row: {
          id: string
          created_at: string
          member_id: string | null
          viewer_auth_id: string | null
          resource_key: string
          surface: string | null
          action: string
        }
        Insert: {
          id?: string
          created_at?: string
          member_id?: string | null
          viewer_auth_id?: string | null
          resource_key: string
          surface?: string | null
          action?: string
        }
        Update: Partial<Database['public']['Tables']['crisis_resource_views']['Insert']>
        Relationships: []
      }
      cultural_festivals: {
        Row: {
          id: string
          created_at: string
          festival_name: string
          culture_label: string
          circle_name: string | null
          festival_date: string
          end_date: string | null
          is_multi_day: boolean
          description: string
          typical_greeting: string | null
          traditions: string | null
          primary_language: string
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          festival_name: string
          culture_label: string
          circle_name?: string | null
          festival_date: string
          end_date?: string | null
          is_multi_day?: boolean
          description: string
          typical_greeting?: string | null
          traditions?: string | null
          primary_language?: string
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['cultural_festivals']['Insert']>
        Relationships: []
      }
      cultural_potlucks: {
        Row: {
          id: string
          created_at: string
          host_member_id: string
          circle_id: string | null
          title: string
          festival_tag: string | null
          potluck_date: string
          potluck_time: string | null
          location_name: string | null
          location_address: string
          city: string | null
          state: string | null
          capacity: number
          description: string | null
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          host_member_id: string
          circle_id?: string | null
          title: string
          festival_tag?: string | null
          potluck_date: string
          potluck_time?: string | null
          location_name?: string | null
          location_address: string
          city?: string | null
          state?: string | null
          capacity?: number
          description?: string | null
          status?: string
        }
        Update: Partial<Database['public']['Tables']['cultural_potlucks']['Insert']>
        Relationships: []
      }
      potluck_signups: {
        Row: {
          id: string
          created_at: string
          potluck_id: string
          member_id: string
          dish_name: string | null
          dish_category: string
          attendee_count: number
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          potluck_id: string
          member_id: string
          dish_name?: string | null
          dish_category?: string
          attendee_count?: number
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['potluck_signups']['Insert']>
        Relationships: []
      }
      cultural_story_sessions: {
        Row: {
          id: string
          created_at: string
          title: string
          circle_id: string | null
          theme: string | null
          session_date: string
          session_time: string | null
          format: string
          dial_in_number: string | null
          dial_in_code: string | null
          video_link: string | null
          facilitator_name: string | null
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          circle_id?: string | null
          theme?: string | null
          session_date: string
          session_time?: string | null
          format?: string
          dial_in_number?: string | null
          dial_in_code?: string | null
          video_link?: string | null
          facilitator_name?: string | null
          status?: string
        }
        Update: Partial<Database['public']['Tables']['cultural_story_sessions']['Insert']>
        Relationships: []
      }
      cultural_story_contributions: {
        Row: {
          id: string
          created_at: string
          session_id: string | null
          member_id: string
          festival_name: string | null
          homeland: string | null
          story_text: string
          saved_to_life_story: boolean
          life_story_entry_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          session_id?: string | null
          member_id: string
          festival_name?: string | null
          homeland?: string | null
          story_text: string
          saved_to_life_story?: boolean
          life_story_entry_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['cultural_story_contributions']['Insert']>
        Relationships: []
      }
      heritage_projects: {
        Row: {
          id: string
          created_at: string
          member_id: string
          student_volunteer_id: string | null
          tradition_topic: string
          school_name: string | null
          project_description: string | null
          status: string
          scheduled_at: string | null
          format: string
          student_reflection: string | null
          elder_notes: string | null
          saved_to_life_story: boolean
          life_story_entry_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          student_volunteer_id?: string | null
          tradition_topic: string
          school_name?: string | null
          project_description?: string | null
          status?: string
          scheduled_at?: string | null
          format?: string
          student_reflection?: string | null
          elder_notes?: string | null
          saved_to_life_story?: boolean
          life_story_entry_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['heritage_projects']['Insert']>
        Relationships: []
      }
      cultural_classes: {
        Row: {
          id: string
          created_at: string
          title: string
          class_type: string
          festival_tag: string | null
          instructor_member_id: string | null
          instructor_name: string | null
          class_date: string
          class_time: string | null
          format: string
          dial_in_number: string | null
          video_link: string | null
          materials_list: string | null
          skill_level: string
          max_participants: number
          registration_count: number
          description: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          class_type?: string
          festival_tag?: string | null
          instructor_member_id?: string | null
          instructor_name?: string | null
          class_date: string
          class_time?: string | null
          format?: string
          dial_in_number?: string | null
          video_link?: string | null
          materials_list?: string | null
          skill_level?: string
          max_participants?: number
          registration_count?: number
          description: string
          status?: string
        }
        Update: Partial<Database['public']['Tables']['cultural_classes']['Insert']>
        Relationships: []
      }
      class_registrations: {
        Row: {
          id: string
          created_at: string
          class_id: string
          member_id: string
          needs_materials_kit: boolean
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          class_id: string
          member_id: string
          needs_materials_kit?: boolean
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['class_registrations']['Insert']>
        Relationships: []
      }
      oral_history_recordings: {
        Row: {
          id: string
          created_at: string
          member_id: string
          recorded_by: string | null
          title: string
          language: string
          topic: string | null
          era: string | null
          description: string | null
          transcript: string | null
          translation_en: string | null
          audio_path: string | null
          duration_seconds: number | null
          consent_given: boolean
          visibility: string
          saved_to_life_story: boolean
          life_story_entry_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          recorded_by?: string | null
          title: string
          language?: string
          topic?: string | null
          era?: string | null
          description?: string | null
          transcript?: string | null
          translation_en?: string | null
          audio_path?: string | null
          duration_seconds?: number | null
          consent_given?: boolean
          visibility?: string
          saved_to_life_story?: boolean
          life_story_entry_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['oral_history_recordings']['Insert']>
        Relationships: []
      }
      premium_addons: {
        Row: {
          id: string
          created_at: string
          addon_key: string
          name: string
          tagline: string | null
          description: string
          billing: AddonBilling
          price_cents: number
          min_plan_tier: string | null
          fulfillment: string
          benefits: string[]
          family_seat_bonus: number
          is_active: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          created_at?: string
          addon_key: string
          name: string
          tagline?: string | null
          description: string
          billing?: AddonBilling
          price_cents: number
          min_plan_tier?: string | null
          fulfillment?: string
          benefits?: string[]
          family_seat_bonus?: number
          is_active?: boolean
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['premium_addons']['Insert']>
        Relationships: []
      }
      member_addons: {
        Row: {
          id: string
          created_at: string
          member_id: string
          addon_id: string
          addon_key: string
          billing: AddonBilling
          price_cents: number
          status: AddonPurchaseStatus
          purchased_by: string | null
          stripe_subscription_id: string | null
          started_at: string
          renews_at: string | null
          cancelled_at: string | null
          fulfilled_at: string | null
          navigator_task_id: string | null
          note: string | null
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          addon_id: string
          addon_key: string
          billing?: AddonBilling
          price_cents: number
          status?: AddonPurchaseStatus
          purchased_by?: string | null
          stripe_subscription_id?: string | null
          started_at?: string
          renews_at?: string | null
          cancelled_at?: string | null
          fulfilled_at?: string | null
          navigator_task_id?: string | null
          note?: string | null
          metadata?: Record<string, unknown>
        }
        Update: Partial<Database['public']['Tables']['member_addons']['Insert']>
        Relationships: []
      }
      caregiver_video_diary_entries: {
        Row: {
          id: string
          created_at: string
          member_id: string
          author_family_member_id: string | null
          title: string
          note: string | null
          video_path: string | null
          visibility: string
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          author_family_member_id?: string | null
          title: string
          note?: string | null
          video_path?: string | null
          visibility?: string
        }
        Update: Partial<Database['public']['Tables']['caregiver_video_diary_entries']['Insert']>
        Relationships: []
      }
      care_planning_sessions: {
        Row: {
          id: string
          created_at: string
          member_id: string
          member_addon_id: string | null
          requested_by: string | null
          status: string
          focus_areas: string[]
          preferred_times: string | null
          scheduled_for: string | null
          navigator_id: string | null
          navigator_task_id: string | null
          summary_note: string | null
          summary_doc_path: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          member_addon_id?: string | null
          requested_by?: string | null
          status?: string
          focus_areas?: string[]
          preferred_times?: string | null
          scheduled_for?: string | null
          navigator_id?: string | null
          navigator_task_id?: string | null
          summary_note?: string | null
          summary_doc_path?: string | null
        }
        Update: Partial<Database['public']['Tables']['care_planning_sessions']['Insert']>
        Relationships: []
      }
      benefits_deep_dives: {
        Row: {
          id: string
          created_at: string
          member_id: string
          member_addon_id: string | null
          requested_by: string | null
          household: Record<string, unknown>
          status: string
          navigator_id: string | null
          navigator_task_id: string | null
          findings_note: string | null
          findings_doc_path: string | null
          estimated_annual_value_cents: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          member_addon_id?: string | null
          requested_by?: string | null
          household?: Record<string, unknown>
          status?: string
          navigator_id?: string | null
          navigator_task_id?: string | null
          findings_note?: string | null
          findings_doc_path?: string | null
          estimated_annual_value_cents?: number | null
        }
        Update: Partial<Database['public']['Tables']['benefits_deep_dives']['Insert']>
        Relationships: []
      }
      memory_book_orders: {
        Row: {
          id: string
          created_at: string
          member_id: string
          member_addon_id: string | null
          ordered_by: string | null
          milestone_age: number
          status: string
          recipient_name: string | null
          recipient_address: string | null
          dedication_text: string | null
          photo_paths: string[]
          goods_order_ref: string | null
          tracking_note: string | null
          navigator_task_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          member_addon_id?: string | null
          ordered_by?: string | null
          milestone_age: number
          status?: string
          recipient_name?: string | null
          recipient_address?: string | null
          dedication_text?: string | null
          photo_paths?: string[]
          goods_order_ref?: string | null
          tracking_note?: string | null
          navigator_task_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['memory_book_orders']['Insert']>
        Relationships: []
      }
      legal_consultations: {
        Row: {
          id: string
          created_at: string
          member_id: string
          member_addon_id: string | null
          requested_by: string | null
          advisor_id: string | null
          topic: string | null
          status: string
          scheduled_for: string | null
          navigator_id: string | null
          navigator_task_id: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          member_addon_id?: string | null
          requested_by?: string | null
          advisor_id?: string | null
          topic?: string | null
          status?: string
          scheduled_for?: string | null
          navigator_id?: string | null
          navigator_task_id?: string | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['legal_consultations']['Insert']>
        Relationships: []
      }
      member_pets: {
        Row: {
          id: string
          created_at: string
          member_id: string
          added_by: string | null
          name: string
          species: string
          breed: string | null
          birth_date: string | null
          adoption_date: string | null
          color_markings: string | null
          notes: string | null
          photo_path: string | null
          is_active: boolean
          passed_away_on: string | null
          memorial_note: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          added_by?: string | null
          name: string
          species?: string
          breed?: string | null
          birth_date?: string | null
          adoption_date?: string | null
          color_markings?: string | null
          notes?: string | null
          photo_path?: string | null
          is_active?: boolean
          passed_away_on?: string | null
          memorial_note?: string | null
        }
        Update: Partial<Database['public']['Tables']['member_pets']['Insert']>
        Relationships: []
      }
      pet_loss_circle_members: {
        Row: {
          id: string
          created_at: string
          member_id: string
          display_name: string
          pet_remembered: string | null
          is_active: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          display_name: string
          pet_remembered?: string | null
          is_active?: boolean
          joined_at?: string
        }
        Update: Partial<Database['public']['Tables']['pet_loss_circle_members']['Insert']>
        Relationships: []
      }
      pet_loss_circle_posts: {
        Row: {
          id: string
          created_at: string
          member_id: string
          author_name: string
          content: string
          post_type: string
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          author_name: string
          content: string
          post_type?: string
        }
        Update: Partial<Database['public']['Tables']['pet_loss_circle_posts']['Insert']>
        Relationships: []
      }
      pet_loss_support_requests: {
        Row: {
          id: string
          created_at: string
          member_id: string
          pet_id: string | null
          pet_name: string | null
          loss_date: string | null
          support_type: string
          message: string | null
          status: string
          navigator_notes: string | null
          navigator_task_id: string | null
          matched_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          pet_id?: string | null
          pet_name?: string | null
          loss_date?: string | null
          support_type?: string
          message?: string | null
          status?: string
          navigator_notes?: string | null
          navigator_task_id?: string | null
          matched_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['pet_loss_support_requests']['Insert']>
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
      event_format: EventFormat
      event_status: EventStatus
      booking_status: BookingStatus
    }
    CompositeTypes: Record<string, never>
  }
}

// Buddy Programme types (migration 054)
export interface BuddyAssignmentRow {
  id: string
  created_at: string
  member_id: string
  volunteer_id: string
  assigned_by: string
  call_frequency: string
  status: string
  ended_at: string | null
  end_reason: string | null
  notes: string | null
}

export interface BuddyAssignmentInsert {
  id?: string
  created_at?: string
  member_id: string
  volunteer_id: string
  assigned_by: string
  call_frequency?: string
  status?: string
  ended_at?: string | null
  end_reason?: string | null
  notes?: string | null
}

export interface BuddyCallRow {
  id: string
  created_at: string
  assignment_id: string
  volunteer_id: string
  member_id: string
  call_date: string
  duration_minutes: number | null
  call_quality: string | null
  buddy_notes: string | null
  family_note: string | null
  concern_flag: boolean
  concern_description: string | null
  milestone_flag: boolean
  milestone_description: string | null
  acknowledged_by: string | null
  acknowledged_at: string | null
}

export interface BuddyCallInsert {
  id?: string
  created_at?: string
  assignment_id: string
  volunteer_id: string
  member_id: string
  call_date?: string
  duration_minutes?: number | null
  call_quality?: string | null
  buddy_notes?: string | null
  family_note?: string | null
  concern_flag?: boolean
  concern_description?: string | null
  milestone_flag?: boolean
  milestone_description?: string | null
  acknowledged_by?: string | null
  acknowledged_at?: string | null
}

// Manually maintained until migration 031 has run in Supabase
export interface TrackedItemRow {
  id: string
  created_at: string
  member_id: string
  item_type: string
  category: string
  item_name: string
  expiration_or_appointment_date: string
  reminder_lead_days: number
  recurrence_cycle_days: number | null
  is_recurring: boolean
  renewal_contact_info: string | null
  attachments: string[]
  status: string
  last_reminded_at: string | null
  snoozed_until: string | null
  notes: string | null
  created_by: string | null
}

// M19 Home Care Agency Portal types (migration 039)
export interface CareAgencyRow {
  id: string
  created_at: string
  name: string
  agency_type: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  license_number: string | null
  clearcare_id: string | null
  alayacare_id: string | null
  wellsky_id: string | null
  status: string
  notes: string | null
}

export interface CareWorkerRow {
  id: string
  created_at: string
  supabase_auth_id: string | null
  agency_id: string
  full_name: string
  email: string
  phone: string | null
  worker_role: string
  certifications: string[]
  is_active: boolean
  notes: string | null
  location_id?: string | null
}

export interface CareVisitRow {
  id: string
  created_at: string
  agency_id: string
  care_worker_id: string
  member_id: string
  scheduled_date: string
  scheduled_start_time: string
  scheduled_end_time: string
  actual_check_in_at: string | null
  actual_check_out_at: string | null
  duration_minutes: number | null
  visit_type: string
  status: string
  care_worker_notes: string | null
  supervisor_notes: string | null
  billing_code: string | null
  billable_hours: number | null
  invoiced: boolean
  location_id?: string | null
}

export interface AgencyReferralRow {
  id: string
  created_at: string
  member_id: string
  referring_navigator_id: string | null
  agency_id: string | null
  status: string
  referral_reason: string | null
  services_requested: string[]
  notes: string | null
  responded_at: string | null
}

// M19 Phase 62 Multi-location Management types (migration 042)
export interface AgencyLocationRow {
  id: string
  created_at: string
  updated_at: string
  agency_id: string
  location_name: string
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  phone: string | null
  is_headquarters: boolean
  is_active: boolean
  manager_name: string | null
  manager_email: string | null
  notes: string | null
}

export interface AgencyLocationInsert {
  id?: string
  created_at?: string
  updated_at?: string
  agency_id: string
  location_name: string
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  phone?: string | null
  is_headquarters?: boolean
  is_active?: boolean
  manager_name?: string | null
  manager_email?: string | null
  notes?: string | null
}

export interface AgencyLocationUpdate {
  location_name?: string
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  phone?: string | null
  is_headquarters?: boolean
  is_active?: boolean
  manager_name?: string | null
  manager_email?: string | null
  notes?: string | null
}

// M19 Phase 60 White Label / Co-branding types (migration 040)
export interface BrandConfigRow {
  id: string
  created_at: string
  updated_at: string
  agency_id: string
  agency_display_name: string | null
  primary_color: string
  secondary_color: string
  logo_storage_path: string | null
  logo_url: string | null
  tagline: string | null
  powered_by_label: string
  is_active: boolean
}

export interface BrandConfigInsert {
  id?: string
  created_at?: string
  updated_at?: string
  agency_id: string
  agency_display_name?: string | null
  primary_color?: string
  secondary_color?: string
  logo_storage_path?: string | null
  logo_url?: string | null
  tagline?: string | null
  powered_by_label?: string
  is_active?: boolean
}

export type BrandConfigUpdate = Partial<BrandConfigInsert>

// M19 Phase 61 Clinical Documentation types (migration 041)
export interface SoapNoteRow {
  id: string
  created_at: string
  updated_at: string
  member_id: string
  agency_id: string
  care_worker_id: string | null
  visit_id: string | null
  subjective: string
  objective: string
  assessment: string
  plan: string
  billing_codes: string[]
  status: 'draft' | 'signed' | 'locked'
  signed_by_name: string | null
  signed_at: string | null
  locked_at: string | null
  note_date: string
  visit_type: string | null
  duration_minutes: number | null
}

export interface SoapNoteInsert {
  id?: string
  created_at?: string
  updated_at?: string
  member_id: string
  agency_id: string
  care_worker_id?: string | null
  visit_id?: string | null
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  billing_codes?: string[]
  status?: 'draft' | 'signed' | 'locked'
  signed_by_name?: string | null
  signed_at?: string | null
  locked_at?: string | null
  note_date?: string
  visit_type?: string | null
  duration_minutes?: number | null
}

export type SoapNoteUpdate = Partial<SoapNoteInsert>

export interface CarePlanVersionRow {
  id: string
  created_at: string
  updated_at: string
  member_id: string
  agency_id: string
  version_number: number
  goals: string
  interventions: string
  visit_frequency: string
  diagnoses: string[]
  functional_status: string | null
  safety_concerns: string | null
  status: string
  approved_by_name: string | null
  approved_at: string | null
  effective_date: string | null
  review_date: string | null
  notes: string | null
}

export interface CarePlanVersionInsert {
  id?: string
  created_at?: string
  updated_at?: string
  member_id: string
  agency_id: string
  version_number?: number
  goals?: string
  interventions?: string
  visit_frequency?: string
  diagnoses?: string[]
  functional_status?: string | null
  safety_concerns?: string | null
  status?: string
  approved_by_name?: string | null
  approved_at?: string | null
  effective_date?: string | null
  review_date?: string | null
  notes?: string | null
}

// M20 Senior Center Portal types (migration 046)
export interface SeniorCenterRow {
  id: string
  created_at: string
  center_name: string
  address: string
  city: string
  state: string
  zip: string | null
  phone: string | null
  email: string | null
  operating_hours: string
  capacity: number
  is_active: boolean
}

export interface CenterDropinRow {
  id: string
  created_at: string
  center_id: string
  member_id: string | null
  visitor_name: string
  visitor_type: string
  check_in_at: string
  check_out_at: string | null
  notes: string | null
}

export interface CenterDropinInsert {
  id?: string
  created_at?: string
  center_id: string
  member_id?: string | null
  visitor_name: string
  visitor_type?: string
  check_in_at?: string
  check_out_at?: string | null
  notes?: string | null
}

export interface CenterActivityRow {
  id: string
  created_at: string
  center_id: string
  title: string
  description: string | null
  activity_type: string
  room: string | null
  instructor_name: string | null
  scheduled_at: string
  duration_minutes: number
  max_capacity: number | null
  registration_count: number
  is_recurring: boolean
  recurrence_rule: string | null
  status: string
}

export interface CenterActivityInsert {
  id?: string
  created_at?: string
  center_id: string
  title: string
  description?: string | null
  activity_type?: string
  room?: string | null
  instructor_name?: string | null
  scheduled_at: string
  duration_minutes?: number
  max_capacity?: number | null
  registration_count?: number
  is_recurring?: boolean
  recurrence_rule?: string | null
  status?: string
}

export interface ActivityRegistrationRow {
  id: string
  created_at: string
  activity_id: string
  center_id: string
  member_id: string | null
  visitor_name: string
  registered_at: string
  attended: boolean
}

export interface RoomBookingRow {
  id: string
  created_at: string
  center_id: string
  room: string
  booking_title: string
  booked_by: string | null
  start_time: string
  end_time: string
  notes: string | null
  status: string
}

export interface RoomBookingInsert {
  id?: string
  created_at?: string
  center_id: string
  room: string
  booking_title: string
  booked_by?: string | null
  start_time: string
  end_time: string
  notes?: string | null
  status?: string
}

export interface CongregrateMealRow {
  id: string
  created_at: string
  center_id: string
  meal_date: string
  meal_type: string
  attendee_count: number
  menu_description: string | null
  notes: string | null
}

export interface CongregrateMealInsert {
  id?: string
  created_at?: string
  center_id: string
  meal_date: string
  meal_type?: string
  attendee_count?: number
  menu_description?: string | null
  notes?: string | null
}

export interface SeniorCenterStats {
  today_dropins: number
  this_week_dropins: number
  this_month_meals: number
  total_meals_attendees_this_month: number
  upcoming_activities: number
  rooms_booked_today: number
}

// ─── M21 — Expanded Volunteer Ecosystem ───────────────────────────────────────

export interface K12SchoolRow {
  id: string
  created_at: string
  school_name: string
  contact_name: string
  contact_email: string
  school_type: string
  grade_levels: string[]
  city: string | null
  state: string | null
  program_types: string[]
  active_student_count: number
  status: string
}

export interface K12SchoolInsert {
  school_name: string
  contact_name: string
  contact_email: string
  school_type?: string
  grade_levels?: string[]
  city?: string | null
  state?: string | null
  program_types?: string[]
}

export interface K12StudentVolunteerRow {
  id: string
  created_at: string
  school_id: string
  student_name: string
  grade_level: string | null
  program_type: string
  member_id: string | null
  total_hours_logged: number
  sessions_completed: number
  status: string
}

export interface MemberAmbassadorRow {
  id: string
  created_at: string
  member_id: string
  nominated_by: string | null
  status: string
  ambassador_since: string
  specialties: string[]
  total_new_members_welcomed: number
  total_events_hosted: number
  notes: string | null
  member?: { preferred_name: string; full_name: string } | null
}

export interface FamilyVolunteerLinkRow {
  id: string
  created_at: string
  volunteer_id: string
  family_member_id: string
  linked_member_id: string
}

// ─── M22 — Device & Smart Home Integration Layer ─────────────────────────────

export type MemberDeviceRow = Database['public']['Tables']['member_devices']['Row']
export type MemberDeviceInsert = Database['public']['Tables']['member_devices']['Insert']
export type DeviceSignalRow = Database['public']['Tables']['device_signals']['Row']
export type WearableConnectionRow = Database['public']['Tables']['wearable_connections']['Row']
export type WearableReadingRow = Database['public']['Tables']['wearable_readings']['Row']
export type FallEventRow = Database['public']['Tables']['fall_events']['Row']
export type EhrConnectionRow = Database['public']['Tables']['ehr_connections']['Row']
export type FhirExportLogRow = Database['public']['Tables']['fhir_export_log']['Row']

// ─── M23 — Advanced AI/ML Layer ─────────────────────────────────────────────

export type WellnessBaselineRow = Database['public']['Tables']['wellness_baselines']['Row']
export type WellnessBaselineInsert = Database['public']['Tables']['wellness_baselines']['Insert']
export type BehavioralAnomalyRow = Database['public']['Tables']['behavioral_anomalies']['Row']
export type FallRiskScoreRow = Database['public']['Tables']['fall_risk_scores']['Row']
export type IsolationScoreRow = Database['public']['Tables']['isolation_scores']['Row']
export type GriefPatternFlagRow = Database['public']['Tables']['grief_pattern_flags']['Row']

// ─── M24 — Professional Services Revenue Layer ──────────────────────────────

export type TrustedAdvisorRow = Database['public']['Tables']['trusted_advisors']['Row']
export type TrustedAdvisorInsert = Database['public']['Tables']['trusted_advisors']['Insert']
export type AdvisorListingApplicationRow = Database['public']['Tables']['advisor_listing_applications']['Row']
export type AdvisorConnectionRow = Database['public']['Tables']['advisor_connections']['Row']
export type AdvisorReviewRow = Database['public']['Tables']['advisor_reviews']['Row']
export type VitaSiteRow = Database['public']['Tables']['vita_sites']['Row']
export type VitaAppointmentRow = Database['public']['Tables']['vita_appointments']['Row']
export type CrisisResourceViewRow = Database['public']['Tables']['crisis_resource_views']['Row']
export type DocumentVaultItemRow = Database['public']['Tables']['document_vault_items']['Row']

// ─── M25 — Cultural Programming Depth ───────────────────────────────────────

export type CulturalFestivalRow = Database['public']['Tables']['cultural_festivals']['Row']
export type CulturalPotluckRow = Database['public']['Tables']['cultural_potlucks']['Row']
export type CulturalPotluckInsert = Database['public']['Tables']['cultural_potlucks']['Insert']
export type PotluckSignupRow = Database['public']['Tables']['potluck_signups']['Row']
export type CulturalStorySessionRow = Database['public']['Tables']['cultural_story_sessions']['Row']
export type CulturalStoryContributionRow = Database['public']['Tables']['cultural_story_contributions']['Row']
export type HeritageProjectRow = Database['public']['Tables']['heritage_projects']['Row']
export type CulturalClassRow = Database['public']['Tables']['cultural_classes']['Row']
export type ClassRegistrationRow = Database['public']['Tables']['class_registrations']['Row']
export type OralHistoryRecordingRow = Database['public']['Tables']['oral_history_recordings']['Row']

// ─── M26 — Premium Subscription Add-Ons ─────────────────────────────────────

export type PremiumAddonRow = Database['public']['Tables']['premium_addons']['Row']
export type MemberAddonRow = Database['public']['Tables']['member_addons']['Row']
export type MemberAddonInsert = Database['public']['Tables']['member_addons']['Insert']
export type CaregiverVideoDiaryEntryRow = Database['public']['Tables']['caregiver_video_diary_entries']['Row']
export type CarePlanningSessionRow = Database['public']['Tables']['care_planning_sessions']['Row']
export type BenefitsDeepDiveRow = Database['public']['Tables']['benefits_deep_dives']['Row']
export type MemoryBookOrderRow = Database['public']['Tables']['memory_book_orders']['Row']
export type LegalConsultationRow = Database['public']['Tables']['legal_consultations']['Row']

// ─── M27 — Pet & Companion Life Tracking ───────────────────────────────────

export type MemberPetRow = Database['public']['Tables']['member_pets']['Row']
export type MemberPetInsert = Database['public']['Tables']['member_pets']['Insert']
export type PetLossCircleMemberRow = Database['public']['Tables']['pet_loss_circle_members']['Row']
export type PetLossCirclePostRow = Database['public']['Tables']['pet_loss_circle_posts']['Row']
export type PetLossSupportRequestRow = Database['public']['Tables']['pet_loss_support_requests']['Row']
