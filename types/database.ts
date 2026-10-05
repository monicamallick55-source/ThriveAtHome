export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aaa_service_units: {
        Row: {
          aaa_id: string
          at_risk_status: boolean | null
          client_age_group: string | null
          client_gender: string | null
          county: string | null
          created_at: string
          disability_status: boolean | null
          fiscal_year: number
          id: string
          lives_alone: boolean | null
          member_id: string | null
          minority_status: boolean | null
          notes: string | null
          nutritional_risk: boolean | null
          poverty_status: boolean | null
          rural_status: boolean | null
          service_date: string
          service_type: string
          title3_category: string
          unit_type: string
          units_provided: number
          worker_name: string | null
        }
        Insert: {
          aaa_id: string
          at_risk_status?: boolean | null
          client_age_group?: string | null
          client_gender?: string | null
          county?: string | null
          created_at?: string
          disability_status?: boolean | null
          fiscal_year?: number
          id?: string
          lives_alone?: boolean | null
          member_id?: string | null
          minority_status?: boolean | null
          notes?: string | null
          nutritional_risk?: boolean | null
          poverty_status?: boolean | null
          rural_status?: boolean | null
          service_date: string
          service_type: string
          title3_category: string
          unit_type?: string
          units_provided?: number
          worker_name?: string | null
        }
        Update: {
          aaa_id?: string
          at_risk_status?: boolean | null
          client_age_group?: string | null
          client_gender?: string | null
          county?: string | null
          created_at?: string
          disability_status?: boolean | null
          fiscal_year?: number
          id?: string
          lives_alone?: boolean | null
          member_id?: string | null
          minority_status?: boolean | null
          notes?: string | null
          nutritional_risk?: boolean | null
          poverty_status?: boolean | null
          rural_status?: boolean | null
          service_date?: string
          service_type?: string
          title3_category?: string
          unit_type?: string
          units_provided?: number
          worker_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aaa_service_units_aaa_id_fkey"
            columns: ["aaa_id"]
            isOneToOne: false
            referencedRelation: "area_agencies_on_aging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aaa_service_units_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_registrations: {
        Row: {
          activity_id: string
          attended: boolean
          center_id: string
          created_at: string
          id: string
          member_id: string | null
          registered_at: string
          visitor_name: string
        }
        Insert: {
          activity_id: string
          attended?: boolean
          center_id: string
          created_at?: string
          id?: string
          member_id?: string | null
          registered_at?: string
          visitor_name: string
        }
        Update: {
          activity_id?: string
          attended?: boolean
          center_id?: string
          created_at?: string
          id?: string
          member_id?: string | null
          registered_at?: string
          visitor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_registrations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "center_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_registrations_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "senior_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_registrations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_connections: {
        Row: {
          advisor_id: string
          created_at: string
          id: string
          introduced_at: string | null
          member_id: string
          member_note: string | null
          navigator_id: string | null
          navigator_note: string | null
          navigator_task_id: string | null
          requested_by: string | null
          status: string
          topic: string | null
        }
        Insert: {
          advisor_id: string
          created_at?: string
          id?: string
          introduced_at?: string | null
          member_id: string
          member_note?: string | null
          navigator_id?: string | null
          navigator_note?: string | null
          navigator_task_id?: string | null
          requested_by?: string | null
          status?: string
          topic?: string | null
        }
        Update: {
          advisor_id?: string
          created_at?: string
          id?: string
          introduced_at?: string | null
          member_id?: string
          member_note?: string | null
          navigator_id?: string | null
          navigator_note?: string | null
          navigator_task_id?: string | null
          requested_by?: string | null
          status?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_connections_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "trusted_advisors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_connections_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_connections_navigator_id_fkey"
            columns: ["navigator_id"]
            isOneToOne: false
            referencedRelation: "care_navigators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_connections_navigator_task_id_fkey"
            columns: ["navigator_task_id"]
            isOneToOne: false
            referencedRelation: "navigator_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_connections_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_listing_applications: {
        Row: {
          advisor_type: Database["public"]["Enums"]["advisor_type"]
          created_at: string
          credentials: string | null
          email: string
          firm_name: string | null
          full_name: string
          id: string
          message: string | null
          phone: string | null
          requested_tier: Database["public"]["Enums"]["advisor_listing_tier"]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_areas: string | null
          status: string
          years_experience: string | null
        }
        Insert: {
          advisor_type: Database["public"]["Enums"]["advisor_type"]
          created_at?: string
          credentials?: string | null
          email: string
          firm_name?: string | null
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          requested_tier?: Database["public"]["Enums"]["advisor_listing_tier"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string | null
          status?: string
          years_experience?: string | null
        }
        Update: {
          advisor_type?: Database["public"]["Enums"]["advisor_type"]
          created_at?: string
          credentials?: string | null
          email?: string
          firm_name?: string | null
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          requested_tier?: Database["public"]["Enums"]["advisor_listing_tier"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string | null
          status?: string
          years_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_listing_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_reviews: {
        Row: {
          advisor_id: string
          connection_id: string | null
          created_at: string
          id: string
          is_published: boolean
          member_id: string
          rating: number
          review_text: string | null
        }
        Insert: {
          advisor_id: string
          connection_id?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          member_id: string
          rating: number
          review_text?: string | null
        }
        Update: {
          advisor_id?: string
          connection_id?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          member_id?: string
          rating?: number
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_reviews_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "trusted_advisors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_reviews_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "advisor_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_reviews_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_locations: {
        Row: {
          address: string | null
          agency_id: string
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          is_headquarters: boolean
          location_name: string
          manager_email: string | null
          manager_name: string | null
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          agency_id: string
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_headquarters?: boolean
          location_name: string
          manager_email?: string | null
          manager_name?: string | null
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          agency_id?: string
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_headquarters?: boolean
          location_name?: string
          manager_email?: string | null
          manager_name?: string | null
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_locations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "care_agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_referral_links: {
        Row: {
          agency_id: string
          created_at: string
          id: string
          is_active: boolean
          referral_code: string
          referral_fee_cents: number
          total_fees_earned_cents: number
          total_referrals: number
        }
        Insert: {
          agency_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          referral_code: string
          referral_fee_cents?: number
          total_fees_earned_cents?: number
          total_referrals?: number
        }
        Update: {
          agency_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          referral_code?: string
          referral_fee_cents?: number
          total_fees_earned_cents?: number
          total_referrals?: number
        }
        Relationships: [
          {
            foreignKeyName: "agency_referral_links_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "care_agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_referrals: {
        Row: {
          agency_id: string | null
          created_at: string
          id: string
          member_id: string
          notes: string | null
          referral_reason: string | null
          referring_navigator_id: string | null
          responded_at: string | null
          services_requested: string[] | null
          status: Database["public"]["Enums"]["referral_status"]
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          id?: string
          member_id: string
          notes?: string | null
          referral_reason?: string | null
          referring_navigator_id?: string | null
          responded_at?: string | null
          services_requested?: string[] | null
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          id?: string
          member_id?: string
          notes?: string | null
          referral_reason?: string | null
          referring_navigator_id?: string | null
          responded_at?: string | null
          services_requested?: string[] | null
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Relationships: [
          {
            foreignKeyName: "agency_referrals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "care_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_referrals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_referrals_referring_navigator_id_fkey"
            columns: ["referring_navigator_id"]
            isOneToOne: false
            referencedRelation: "care_navigators"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at: string
          icd10_codes: string[]
          id: string
          member_id: string
          message: string
          metadata: Json
          severity: Database["public"]["Enums"]["alert_severity"]
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          icd10_codes?: string[]
          id?: string
          member_id: string
          message: string
          metadata?: Json
          severity: Database["public"]["Enums"]["alert_severity"]
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          icd10_codes?: string[]
          id?: string
          member_id?: string
          message?: string
          metadata?: Json
          severity?: Database["public"]["Enums"]["alert_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      area_agencies_on_aging: {
        Row: {
          address: string | null
          agency_name: string
          annual_title3_budget_cents: number | null
          city: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          counties_served: string[] | null
          created_at: string
          fiscal_year_start: number
          id: string
          is_active: boolean
          psa_number: string | null
          state: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          agency_name: string
          annual_title3_budget_cents?: number | null
          city?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          counties_served?: string[] | null
          created_at?: string
          fiscal_year_start?: number
          id?: string
          is_active?: boolean
          psa_number?: string | null
          state?: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          agency_name?: string
          annual_title3_budget_cents?: number | null
          city?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          counties_served?: string[] | null
          created_at?: string
          fiscal_year_start?: number
          id?: string
          is_active?: boolean
          psa_number?: string | null
          state?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      behavioral_anomalies: {
        Row: {
          alert_id: string | null
          anomaly_score: number
          created_at: string
          detected_at: string
          features: Json
          id: string
          member_id: string
          method: string
          navigator_task_id: string | null
          resolved: boolean
          resolved_at: string | null
          severity: string
          top_drivers: string[] | null
        }
        Insert: {
          alert_id?: string | null
          anomaly_score?: number
          created_at?: string
          detected_at?: string
          features?: Json
          id?: string
          member_id: string
          method?: string
          navigator_task_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          top_drivers?: string[] | null
        }
        Update: {
          alert_id?: string | null
          anomaly_score?: number
          created_at?: string
          detected_at?: string
          features?: Json
          id?: string
          member_id?: string
          method?: string
          navigator_task_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          top_drivers?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_anomalies_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_anomalies_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_anomalies_navigator_task_id_fkey"
            columns: ["navigator_task_id"]
            isOneToOne: false
            referencedRelation: "navigator_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits_deep_dives: {
        Row: {
          created_at: string
          estimated_annual_value_cents: number | null
          findings_doc_path: string | null
          findings_note: string | null
          household: Json
          id: string
          member_addon_id: string | null
          member_id: string
          navigator_id: string | null
          navigator_task_id: string | null
          requested_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          estimated_annual_value_cents?: number | null
          findings_doc_path?: string | null
          findings_note?: string | null
          household?: Json
          id?: string
          member_addon_id?: string | null
          member_id: string
          navigator_id?: string | null
          navigator_task_id?: string | null
          requested_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          estimated_annual_value_cents?: number | null
          findings_doc_path?: string | null
          findings_note?: string | null
          household?: Json
          id?: string
          member_addon_id?: string | null
          member_id?: string
          navigator_id?: string | null
          navigator_task_id?: string | null
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefits_deep_dives_member_addon_id_fkey"
            columns: ["member_addon_id"]
            isOneToOne: false
            referencedRelation: "member_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefits_deep_dives_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefits_deep_dives_navigator_id_fkey"
            columns: ["navigator_id"]
            isOneToOne: false
            referencedRelation: "care_navigators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefits_deep_dives_navigator_task_id_fkey"
            columns: ["navigator_task_id"]
            isOneToOne: false
            referencedRelation: "navigator_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefits_deep_dives_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_configs: {
        Row: {
          agency_display_name: string | null
          agency_id: string
          created_at: string
          id: string
          is_active: boolean
          logo_storage_path: string | null
          logo_url: string | null
          powered_by_label: string
          primary_color: string
          secondary_color: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          agency_display_name?: string | null
          agency_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_storage_path?: string | null
          logo_url?: string | null
          powered_by_label?: string
          primary_color?: string
          secondary_color?: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          agency_display_name?: string | null
          agency_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_storage_path?: string | null
          logo_url?: string | null
          powered_by_label?: string
          primary_color?: string
          secondary_color?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_configs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "care_agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      buddy_assignments: {
        Row: {
          assigned_at: string
          call_frequency: string
          created_at: string
          end_reason: string | null
          ended_at: string | null
          id: string
          match_reasons: Json
          match_score: number
          member_id: string
          navigator_notes: string | null
          preferred_call_day: string | null
          preferred_call_time: string | null
          status: string
          transition_buddy_id: string | null
          volunteer_id: string
        }
        Insert: {
          assigned_at?: string
          call_frequency?: string
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          match_reasons?: Json
          match_score?: number
          member_id: string
          navigator_notes?: string | null
          preferred_call_day?: string | null
          preferred_call_time?: string | null
          status?: string
          transition_buddy_id?: string | null
          volunteer_id: string
        }
        Update: {
          assigned_at?: string
          call_frequency?: string
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          match_reasons?: Json
          match_score?: number
          member_id?: string
          navigator_notes?: string | null
          preferred_call_day?: string | null
          preferred_call_time?: string | null
          status?: string
          transition_buddy_id?: string | null
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buddy_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_assignments_transition_buddy_id_fkey"
            columns: ["transition_buddy_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_assignments_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      buddy_calls: {
        Row: {
          aria_brief_shown: boolean
          aria_context_snapshot: Json | null
          assignment_id: string
          buddy_notes: string | null
          call_quality: number | null
          concern_description: string | null
          concern_flag: boolean
          created_at: string
          duration_minutes: number | null
          family_note: string | null
          id: string
          member_id: string
          milestone_description: string | null
          milestone_flag: boolean
          scheduled_at: string | null
          started_at: string | null
          volunteer_id: string
        }
        Insert: {
          aria_brief_shown?: boolean
          aria_context_snapshot?: Json | null
          assignment_id: string
          buddy_notes?: string | null
          call_quality?: number | null
          concern_description?: string | null
          concern_flag?: boolean
          created_at?: string
          duration_minutes?: number | null
          family_note?: string | null
          id?: string
          member_id: string
          milestone_description?: string | null
          milestone_flag?: boolean
          scheduled_at?: string | null
          started_at?: string | null
          volunteer_id: string
        }
        Update: {
          aria_brief_shown?: boolean
          aria_context_snapshot?: Json | null
          assignment_id?: string
          buddy_notes?: string | null
          call_quality?: number | null
          concern_description?: string | null
          concern_flag?: boolean
          created_at?: string
          duration_minutes?: number | null
          family_note?: string | null
          id?: string
          member_id?: string
          milestone_description?: string | null
          milestone_flag?: boolean
          scheduled_at?: string | null
          started_at?: string | null
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buddy_calls_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "buddy_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_calls_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_calls_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      callback_requests: {
        Row: {
          call_id: string | null
          created_at: string
          id: string
          member_id: string
          notes: string | null
          preferred_time: string | null
          requested_via: string
          status: string
          triggered_at: string | null
        }
        Insert: {
          call_id?: string | null
          created_at?: string
          id?: string
          member_id: string
          notes?: string | null
          preferred_time?: string | null
          requested_via?: string
          status?: string
          triggered_at?: string | null
        }
        Update: {
          call_id?: string | null
          created_at?: string
          id?: string
          member_id?: string
          notes?: string | null
          preferred_time?: string | null
          requested_via?: string
          status?: string
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "callback_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      care_agencies: {
        Row: {
          address: string | null
          agency_type: Database["public"]["Enums"]["agency_type"]
          alayacare_id: string | null
          city: string | null
          clearcare_id: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          id: string
          license_number: string | null
          name: string
          notes: string | null
          state: string | null
          status: string
          wellsky_id: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          agency_type?: Database["public"]["Enums"]["agency_type"]
          alayacare_id?: string | null
          city?: string | null
          clearcare_id?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          license_number?: string | null
          name: string
          notes?: string | null
          state?: string | null
          status?: string
          wellsky_id?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          agency_type?: Database["public"]["Enums"]["agency_type"]
          alayacare_id?: string | null
          city?: string | null
          clearcare_id?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          license_number?: string | null
          name?: string
          notes?: string | null
          state?: string | null
          status?: string
          wellsky_id?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      care_navigators: {
        Row: {
          caseload_limit: number
          certifications: string[] | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          supabase_auth_id: string | null
        }
        Insert: {
          caseload_limit?: number
          certifications?: string[] | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          supabase_auth_id?: string | null
        }
        Update: {
          caseload_limit?: number
          certifications?: string[] | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          supabase_auth_id?: string | null
        }
        Relationships: []
      }
      care_plan_versions: {
        Row: {
          agency_id: string
          approved_at: string | null
          approved_by_name: string | null
          created_at: string
          diagnoses: string[] | null
          effective_date: string | null
          functional_status: string | null
          goals: string
          id: string
          interventions: string
          member_id: string
          notes: string | null
          review_date: string | null
          safety_concerns: string | null
          status: string
          updated_at: string
          version_number: number
          visit_frequency: string
        }
        Insert: {
          agency_id: string
          approved_at?: string | null
          approved_by_name?: string | null
          created_at?: string
          diagnoses?: string[] | null
          effective_date?: string | null
          functional_status?: string | null
          goals?: string
          id?: string
          interventions?: string
          member_id: string
          notes?: string | null
          review_date?: string | null
          safety_concerns?: string | null
          status?: string
          updated_at?: string
          version_number?: number
          visit_frequency?: string
        }
        Update: {
          agency_id?: string
          approved_at?: string | null
          approved_by_name?: string | null
          created_at?: string
          diagnoses?: string[] | null
          effective_date?: string | null
          functional_status?: string | null
          goals?: string
          id?: string
          interventions?: string
          member_id?: string
          notes?: string | null
          review_date?: string | null
          safety_concerns?: string | null
          status?: string
          updated_at?: string
          version_number?: number
          visit_frequency?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_plan_versions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "care_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plan_versions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      care_planning_sessions: {
        Row: {
          created_at: string
          focus_areas: string[]
          id: string
          member_addon_id: string | null
          member_id: string
          navigator_id: string | null
          navigator_task_id: string | null
          preferred_times: string | null
          requested_by: string | null
          scheduled_for: string | null
          status: string
          summary_doc_path: string | null
          summary_note: string | null
        }
        Insert: {
          created_at?: string
          focus_areas?: string[]
          id?: string
          member_addon_id?: string | null
          member_id: string
          navigator_id?: string | null
          navigator_task_id?: string | null
          preferred_times?: string | null
          requested_by?: string | null
          scheduled_for?: string | null
          status?: string
          summary_doc_path?: string | null
          summary_note?: string | null
        }
        Update: {
          created_at?: string
          focus_areas?: string[]
          id?: string
          member_addon_id?: string | null
          member_id?: string
          navigator_id?: string | null
          navigator_task_id?: string | null
          preferred_times?: string | null
          requested_by?: string | null
          scheduled_for?: string | null
          status?: string
          summary_doc_path?: string | null
          summary_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_planning_sessions_member_addon_id_fkey"
            columns: ["member_addon_id"]
            isOneToOne: false
            referencedRelation: "member_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_planning_sessions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_planning_sessions_navigator_id_fkey"
            columns: ["navigator_id"]
            isOneToOne: false
            referencedRelation: "care_navigators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_planning_sessions_navigator_task_id_fkey"
            columns: ["navigator_task_id"]
            isOneToOne: false
            referencedRelation: "navigator_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_planning_sessions_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      care_visits: {
        Row: {
          actual_check_in_at: string | null
          actual_check_out_at: string | null
          agency_id: string
          billable_hours: number | null
          billing_code: string | null
          care_worker_id: string
          care_worker_notes: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          invoiced: boolean
          location_id: string | null
          member_id: string
          scheduled_date: string
          scheduled_end_time: string
          scheduled_start_time: string
          status: Database["public"]["Enums"]["agency_visit_status"]
          supervisor_notes: string | null
          visit_type: Database["public"]["Enums"]["agency_visit_type"]
        }
        Insert: {
          actual_check_in_at?: string | null
          actual_check_out_at?: string | null
          agency_id: string
          billable_hours?: number | null
          billing_code?: string | null
          care_worker_id: string
          care_worker_notes?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          invoiced?: boolean
          location_id?: string | null
          member_id: string
          scheduled_date: string
          scheduled_end_time: string
          scheduled_start_time: string
          status?: Database["public"]["Enums"]["agency_visit_status"]
          supervisor_notes?: string | null
          visit_type?: Database["public"]["Enums"]["agency_visit_type"]
        }
        Update: {
          actual_check_in_at?: string | null
          actual_check_out_at?: string | null
          agency_id?: string
          billable_hours?: number | null
          billing_code?: string | null
          care_worker_id?: string
          care_worker_notes?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          invoiced?: boolean
          location_id?: string | null
          member_id?: string
          scheduled_date?: string
          scheduled_end_time?: string
          scheduled_start_time?: string
          status?: Database["public"]["Enums"]["agency_visit_status"]
          supervisor_notes?: string | null
          visit_type?: Database["public"]["Enums"]["agency_visit_type"]
        }
        Relationships: [
          {
            foreignKeyName: "care_visits_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "care_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_visits_care_worker_id_fkey"
            columns: ["care_worker_id"]
            isOneToOne: false
            referencedRelation: "care_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_visits_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "agency_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_visits_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      care_workers: {
        Row: {
          agency_id: string
          certifications: string[] | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          location_id: string | null
          notes: string | null
          phone: string | null
          supabase_auth_id: string | null
          worker_role: Database["public"]["Enums"]["care_worker_role"]
        }
        Insert: {
          agency_id: string
          certifications?: string[] | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          notes?: string | null
          phone?: string | null
          supabase_auth_id?: string | null
          worker_role?: Database["public"]["Enums"]["care_worker_role"]
        }
        Update: {
          agency_id?: string
          certifications?: string[] | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          notes?: string | null
          phone?: string | null
          supabase_auth_id?: string | null
          worker_role?: Database["public"]["Enums"]["care_worker_role"]
        }
        Relationships: [
          {
            foreignKeyName: "care_workers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "care_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_workers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "agency_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_video_diary_entries: {
        Row: {
          author_family_member_id: string | null
          created_at: string
          id: string
          member_id: string
          note: string | null
          title: string
          video_path: string | null
          visibility: string
        }
        Insert: {
          author_family_member_id?: string | null
          created_at?: string
          id?: string
          member_id: string
          note?: string | null
          title: string
          video_path?: string | null
          visibility?: string
        }
        Update: {
          author_family_member_id?: string | null
          created_at?: string
          id?: string
          member_id?: string
          note?: string | null
          title?: string
          video_path?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_video_diary_entries_author_family_member_id_fkey"
            columns: ["author_family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caregiver_video_diary_entries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      celebration_events: {
        Row: {
          ai_message: string | null
          celebration_type: string
          community_posted_at: string | null
          created_at: string
          event_date: string
          family_notified_at: string | null
          id: string
          member_id: string
          pet_id: string | null
          pet_name: string | null
          status: string
        }
        Insert: {
          ai_message?: string | null
          celebration_type: string
          community_posted_at?: string | null
          created_at?: string
          event_date: string
          family_notified_at?: string | null
          id?: string
          member_id: string
          pet_id?: string | null
          pet_name?: string | null
          status?: string
        }
        Update: {
          ai_message?: string | null
          celebration_type?: string
          community_posted_at?: string | null
          created_at?: string
          event_date?: string
          family_notified_at?: string | null
          id?: string
          member_id?: string
          pet_id?: string | null
          pet_name?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "celebration_events_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "celebration_events_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "member_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      center_activities: {
        Row: {
          activity_type: string
          center_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          instructor_name: string | null
          is_recurring: boolean
          max_capacity: number | null
          recurrence_rule: string | null
          registration_count: number
          room: string | null
          scheduled_at: string
          status: string
          title: string
        }
        Insert: {
          activity_type?: string
          center_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor_name?: string | null
          is_recurring?: boolean
          max_capacity?: number | null
          recurrence_rule?: string | null
          registration_count?: number
          room?: string | null
          scheduled_at: string
          status?: string
          title: string
        }
        Update: {
          activity_type?: string
          center_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor_name?: string | null
          is_recurring?: boolean
          max_capacity?: number | null
          recurrence_rule?: string | null
          registration_count?: number
          room?: string | null
          scheduled_at?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_activities_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "senior_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      center_dropins: {
        Row: {
          center_id: string
          check_in_at: string
          check_out_at: string | null
          created_at: string
          id: string
          member_id: string | null
          notes: string | null
          visitor_name: string
          visitor_type: string
        }
        Insert: {
          center_id: string
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string
          id?: string
          member_id?: string | null
          notes?: string | null
          visitor_name: string
          visitor_type?: string
        }
        Update: {
          center_id?: string
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string
          id?: string
          member_id?: string | null
          notes?: string | null
          visitor_name?: string
          visitor_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_dropins_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "senior_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "center_dropins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      check_in_calls: {
        Row: {
          agent_id: string | null
          agent_name: string | null
          agents_involved: string[]
          ai_summary: string | null
          alert_flags: Json
          call_type: Database["public"]["Enums"]["call_type"]
          caller_role: string | null
          cognitive_concern_signal: boolean | null
          created_at: string
          direction: string | null
          duration_seconds: number | null
          ended_at: string | null
          energy_score: number | null
          fall_risk_mention: boolean | null
          from_number: string | null
          id: string
          medication_adherence: boolean | null
          medication_taken: boolean | null
          member_id: string | null
          mood_score: number | null
          pain_mentioned: boolean | null
          pain_score: number | null
          processed_at: string | null
          recording_url: string | null
          retell_call_id: string | null
          scheduled_at: string | null
          social_isolation_signal: boolean | null
          started_at: string | null
          status: Database["public"]["Enums"]["call_status"]
          to_number: string | null
          transcript: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_name?: string | null
          agents_involved?: string[]
          ai_summary?: string | null
          alert_flags?: Json
          call_type?: Database["public"]["Enums"]["call_type"]
          caller_role?: string | null
          cognitive_concern_signal?: boolean | null
          created_at?: string
          direction?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          energy_score?: number | null
          fall_risk_mention?: boolean | null
          from_number?: string | null
          id?: string
          medication_adherence?: boolean | null
          medication_taken?: boolean | null
          member_id?: string | null
          mood_score?: number | null
          pain_mentioned?: boolean | null
          pain_score?: number | null
          processed_at?: string | null
          recording_url?: string | null
          retell_call_id?: string | null
          scheduled_at?: string | null
          social_isolation_signal?: boolean | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          to_number?: string | null
          transcript?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_name?: string | null
          agents_involved?: string[]
          ai_summary?: string | null
          alert_flags?: Json
          call_type?: Database["public"]["Enums"]["call_type"]
          caller_role?: string | null
          cognitive_concern_signal?: boolean | null
          created_at?: string
          direction?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          energy_score?: number | null
          fall_risk_mention?: boolean | null
          from_number?: string | null
          id?: string
          medication_adherence?: boolean | null
          medication_taken?: boolean | null
          member_id?: string | null
          mood_score?: number | null
          pain_mentioned?: boolean | null
          pain_score?: number | null
          processed_at?: string | null
          recording_url?: string | null
          retell_call_id?: string | null
          scheduled_at?: string | null
          social_isolation_signal?: boolean | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          to_number?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_in_calls_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          member_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          member_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "circle_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_event_rsvps_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_events: {
        Row: {
          circle_id: string | null
          circle_ids: string[] | null
          created_at: string
          description: string | null
          dial_in_code: string | null
          dial_in_number: string | null
          event_date: string
          event_time: string | null
          format: string
          id: string
          is_platform_wide: boolean
          is_recurring: boolean
          location_address: string | null
          rsvp_count: number
          title: string
          video_link: string | null
        }
        Insert: {
          circle_id?: string | null
          circle_ids?: string[] | null
          created_at?: string
          description?: string | null
          dial_in_code?: string | null
          dial_in_number?: string | null
          event_date: string
          event_time?: string | null
          format?: string
          id?: string
          is_platform_wide?: boolean
          is_recurring?: boolean
          location_address?: string | null
          rsvp_count?: number
          title: string
          video_link?: string | null
        }
        Update: {
          circle_id?: string | null
          circle_ids?: string[] | null
          created_at?: string
          description?: string | null
          dial_in_code?: string | null
          dial_in_number?: string | null
          event_date?: string
          event_time?: string | null
          format?: string
          id?: string
          is_platform_wide?: boolean
          is_recurring?: boolean
          location_address?: string | null
          rsvp_count?: number
          title?: string
          video_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "circle_events_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "cultural_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_memberships: {
        Row: {
          circle_id: string
          created_at: string
          id: string
          is_ambassador: boolean
          joined_at: string
          member_id: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          id?: string
          is_ambassador?: boolean
          joined_at?: string
          member_id: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          id?: string
          is_ambassador?: boolean
          joined_at?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_memberships_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "cultural_circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_hidden: boolean
          member_id: string
          post_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          member_id: string
          post_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          member_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_post_comments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "circle_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_posts: {
        Row: {
          circle_id: string
          comment_count: number
          content: string
          created_at: string
          id: string
          is_hidden: boolean
          member_id: string
          post_type: string
        }
        Insert: {
          circle_id: string
          comment_count?: number
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          member_id: string
          post_type?: string
        }
        Update: {
          circle_id?: string
          comment_count?: number
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          member_id?: string
          post_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_posts_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "cultural_circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_posts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      class_registrations: {
        Row: {
          class_id: string
          created_at: string
          id: string
          member_id: string
          needs_materials_kit: boolean
          notes: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          member_id: string
          needs_materials_kit?: boolean
          notes?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          member_id?: string
          needs_materials_kit?: boolean
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_registrations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "cultural_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_registrations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      community_orgs: {
        Row: {
          address: string | null
          annual_dues_sliding_low_cents: number
          annual_dues_sliding_mid_cents: number
          annual_dues_standard_cents: number
          city: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          description: string | null
          dues_description: string | null
          helpful_village_org_id: string | null
          hv_sync_enabled: boolean
          id: string
          is_active: boolean
          member_count: number
          mon_ami_integration: boolean
          network_id: string | null
          org_api_key: string | null
          org_name: string
          org_type: Database["public"]["Enums"]["org_type"]
          plan_tier: string
          service_area_description: string | null
          slug: string | null
          state: string | null
          updated_at: string
          website_url: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          annual_dues_sliding_low_cents?: number
          annual_dues_sliding_mid_cents?: number
          annual_dues_standard_cents?: number
          city?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          dues_description?: string | null
          helpful_village_org_id?: string | null
          hv_sync_enabled?: boolean
          id?: string
          is_active?: boolean
          member_count?: number
          mon_ami_integration?: boolean
          network_id?: string | null
          org_api_key?: string | null
          org_name: string
          org_type?: Database["public"]["Enums"]["org_type"]
          plan_tier?: string
          service_area_description?: string | null
          slug?: string | null
          state?: string | null
          updated_at?: string
          website_url?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          annual_dues_sliding_low_cents?: number
          annual_dues_sliding_mid_cents?: number
          annual_dues_standard_cents?: number
          city?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          dues_description?: string | null
          helpful_village_org_id?: string | null
          hv_sync_enabled?: boolean
          id?: string
          is_active?: boolean
          member_count?: number
          mon_ami_integration?: boolean
          network_id?: string | null
          org_api_key?: string | null
          org_name?: string
          org_type?: Database["public"]["Enums"]["org_type"]
          plan_tier?: string
          service_area_description?: string | null
          slug?: string | null
          state?: string | null
          updated_at?: string
          website_url?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_orgs_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "network_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reports: {
        Row: {
          comment_id: string | null
          created_at: string
          details: string | null
          id: string
          post_id: string | null
          reason: string
          reported_by: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string | null
          reason: string
          reported_by: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string | null
          reason?: string
          reported_by?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "circle_post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "circle_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      companions: {
        Row: {
          bio: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string
          hourly_rate: number
          id: string
          is_active: boolean
          languages: string[] | null
          rating_average: number | null
          service_types: string[] | null
          state: string | null
          stripe_account_id: string | null
          supabase_auth_id: string | null
          total_sessions: number
        }
        Insert: {
          bio?: string | null
          city?: string | null
          created_at?: string
          email: string
          full_name: string
          hourly_rate?: number
          id?: string
          is_active?: boolean
          languages?: string[] | null
          rating_average?: number | null
          service_types?: string[] | null
          state?: string | null
          stripe_account_id?: string | null
          supabase_auth_id?: string | null
          total_sessions?: number
        }
        Update: {
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string
          hourly_rate?: number
          id?: string
          is_active?: boolean
          languages?: string[] | null
          rating_average?: number | null
          service_types?: string[] | null
          state?: string | null
          stripe_account_id?: string | null
          supabase_auth_id?: string | null
          total_sessions?: number
        }
        Relationships: []
      }
      congregate_meals: {
        Row: {
          attendee_count: number
          center_id: string
          created_at: string
          id: string
          meal_date: string
          meal_type: string
          menu_description: string | null
          notes: string | null
        }
        Insert: {
          attendee_count?: number
          center_id: string
          created_at?: string
          id?: string
          meal_date: string
          meal_type?: string
          menu_description?: string | null
          notes?: string | null
        }
        Update: {
          attendee_count?: number
          center_id?: string
          created_at?: string
          id?: string
          meal_date?: string
          meal_type?: string
          menu_description?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "congregate_meals_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "senior_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_test: {
        Row: {
          id: number
          message: string | null
        }
        Insert: {
          id?: number
          message?: string | null
        }
        Update: {
          id?: number
          message?: string | null
        }
        Relationships: []
      }
      corporate_volunteer_hours: {
        Row: {
          corporate_program_id: string
          created_at: string
          export_status: string
          hours_logged: number
          id: string
          logged_date: string
          verified: boolean
          verified_by: string | null
          visit_id: string | null
          volunteer_id: string
        }
        Insert: {
          corporate_program_id: string
          created_at?: string
          export_status?: string
          hours_logged: number
          id?: string
          logged_date: string
          verified?: boolean
          verified_by?: string | null
          visit_id?: string | null
          volunteer_id: string
        }
        Update: {
          corporate_program_id?: string
          created_at?: string
          export_status?: string
          hours_logged?: number
          id?: string
          logged_date?: string
          verified?: boolean
          verified_by?: string | null
          visit_id?: string | null
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_volunteer_hours_corporate_program_id_fkey"
            columns: ["corporate_program_id"]
            isOneToOne: false
            referencedRelation: "corporate_volunteer_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_volunteer_hours_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "care_navigators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_volunteer_hours_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "volunteer_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_volunteer_hours_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_volunteer_programs: {
        Row: {
          annual_hour_cap_per_employee: number | null
          created_at: string
          employer_account_id: string
          id: string
          integration_type: string
          matching_rate_per_hour: number
          package_type: string
          program_name: string
          status: string
          tier: string
          total_hours_logged: number
          total_matched_value: number
        }
        Insert: {
          annual_hour_cap_per_employee?: number | null
          created_at?: string
          employer_account_id: string
          id?: string
          integration_type?: string
          matching_rate_per_hour?: number
          package_type?: string
          program_name: string
          status?: string
          tier?: string
          total_hours_logged?: number
          total_matched_value?: number
        }
        Update: {
          annual_hour_cap_per_employee?: number | null
          created_at?: string
          employer_account_id?: string
          id?: string
          integration_type?: string
          matching_rate_per_hour?: number
          package_type?: string
          program_name?: string
          status?: string
          tier?: string
          total_hours_logged?: number
          total_matched_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "corporate_volunteer_programs_employer_account_id_fkey"
            columns: ["employer_account_id"]
            isOneToOne: false
            referencedRelation: "employer_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      crisis_resource_views: {
        Row: {
          action: string
          created_at: string
          id: string
          member_id: string | null
          resource_key: string
          surface: string | null
          viewer_auth_id: string | null
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          member_id?: string | null
          resource_key: string
          surface?: string | null
          viewer_auth_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          member_id?: string | null
          resource_key?: string
          surface?: string | null
          viewer_auth_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crisis_resource_views_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      cultural_circles: {
        Row: {
          circle_name: string
          community_type: string
          created_at: string
          description: string
          id: string
          image_placeholder: string | null
          interest_tag: string | null
          is_active: boolean
          member_count: number
          primary_language: string
        }
        Insert: {
          circle_name: string
          community_type?: string
          created_at?: string
          description: string
          id?: string
          image_placeholder?: string | null
          interest_tag?: string | null
          is_active?: boolean
          member_count?: number
          primary_language?: string
        }
        Update: {
          circle_name?: string
          community_type?: string
          created_at?: string
          description?: string
          id?: string
          image_placeholder?: string | null
          interest_tag?: string | null
          is_active?: boolean
          member_count?: number
          primary_language?: string
        }
        Relationships: []
      }
      cultural_classes: {
        Row: {
          class_date: string
          class_time: string | null
          class_type: string
          created_at: string
          description: string
          dial_in_number: string | null
          festival_tag: string | null
          format: string
          id: string
          instructor_member_id: string | null
          instructor_name: string | null
          materials_list: string | null
          max_participants: number
          registration_count: number
          skill_level: string
          status: string
          title: string
          video_link: string | null
        }
        Insert: {
          class_date: string
          class_time?: string | null
          class_type?: string
          created_at?: string
          description: string
          dial_in_number?: string | null
          festival_tag?: string | null
          format?: string
          id?: string
          instructor_member_id?: string | null
          instructor_name?: string | null
          materials_list?: string | null
          max_participants?: number
          registration_count?: number
          skill_level?: string
          status?: string
          title: string
          video_link?: string | null
        }
        Update: {
          class_date?: string
          class_time?: string | null
          class_type?: string
          created_at?: string
          description?: string
          dial_in_number?: string | null
          festival_tag?: string | null
          format?: string
          id?: string
          instructor_member_id?: string | null
          instructor_name?: string | null
          materials_list?: string | null
          max_participants?: number
          registration_count?: number
          skill_level?: string
          status?: string
          title?: string
          video_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cultural_classes_instructor_member_id_fkey"
            columns: ["instructor_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      cultural_festivals: {
        Row: {
          circle_name: string | null
          created_at: string
          culture_label: string
          description: string
          end_date: string | null
          festival_date: string
          festival_name: string
          id: string
          is_active: boolean
          is_multi_day: boolean
          primary_language: string
          traditions: string | null
          typical_greeting: string | null
        }
        Insert: {
          circle_name?: string | null
          created_at?: string
          culture_label: string
          description: string
          end_date?: string | null
          festival_date: string
          festival_name: string
          id?: string
          is_active?: boolean
          is_multi_day?: boolean
          primary_language?: string
          traditions?: string | null
          typical_greeting?: string | null
        }
        Update: {
          circle_name?: string | null
          created_at?: string
          culture_label?: string
          description?: string
          end_date?: string | null
          festival_date?: string
          festival_name?: string
          id?: string
          is_active?: boolean
          is_multi_day?: boolean
          primary_language?: string
          traditions?: string | null
          typical_greeting?: string | null
        }
        Relationships: []
      }
      cultural_potlucks: {
        Row: {
          capacity: number
          circle_id: string | null
          city: string | null
          created_at: string
          description: string | null
          festival_tag: string | null
          host_member_id: string
          id: string
          location_address: string
          location_name: string | null
          potluck_date: string
          potluck_time: string | null
          state: string | null
          status: string
          title: string
        }
        Insert: {
          capacity?: number
          circle_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          festival_tag?: string | null
          host_member_id: string
          id?: string
          location_address: string
          location_name?: string | null
          potluck_date: string
          potluck_time?: string | null
          state?: string | null
          status?: string
          title: string
        }
        Update: {
          capacity?: number
          circle_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          festival_tag?: string | null
          host_member_id?: string
          id?: string
          location_address?: string
          location_name?: string | null
          potluck_date?: string
          potluck_time?: string | null
          state?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultural_potlucks_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "cultural_circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cultural_potlucks_host_member_id_fkey"
            columns: ["host_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      cultural_story_contributions: {
        Row: {
          created_at: string
          festival_name: string | null
          homeland: string | null
          id: string
          life_story_entry_id: string | null
          member_id: string
          saved_to_life_story: boolean
          session_id: string | null
          story_text: string
        }
        Insert: {
          created_at?: string
          festival_name?: string | null
          homeland?: string | null
          id?: string
          life_story_entry_id?: string | null
          member_id: string
          saved_to_life_story?: boolean
          session_id?: string | null
          story_text: string
        }
        Update: {
          created_at?: string
          festival_name?: string | null
          homeland?: string | null
          id?: string
          life_story_entry_id?: string | null
          member_id?: string
          saved_to_life_story?: boolean
          session_id?: string | null
          story_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultural_story_contributions_life_story_entry_id_fkey"
            columns: ["life_story_entry_id"]
            isOneToOne: false
            referencedRelation: "life_story_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cultural_story_contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cultural_story_contributions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cultural_story_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cultural_story_sessions: {
        Row: {
          circle_id: string | null
          created_at: string
          dial_in_code: string | null
          dial_in_number: string | null
          facilitator_name: string | null
          format: string
          id: string
          session_date: string
          session_time: string | null
          status: string
          theme: string | null
          title: string
          video_link: string | null
        }
        Insert: {
          circle_id?: string | null
          created_at?: string
          dial_in_code?: string | null
          dial_in_number?: string | null
          facilitator_name?: string | null
          format?: string
          id?: string
          session_date: string
          session_time?: string | null
          status?: string
          theme?: string | null
          title: string
          video_link?: string | null
        }
        Update: {
          circle_id?: string | null
          created_at?: string
          dial_in_code?: string | null
          dial_in_number?: string | null
          facilitator_name?: string | null
          format?: string
          id?: string
          session_date?: string
          session_time?: string | null
          status?: string
          theme?: string | null
          title?: string
          video_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cultural_story_sessions_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "cultural_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_signals: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          member_id: string
          occurred_at: string
          processed: boolean
          signal_type: string
          signal_value: Json
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          member_id: string
          occurred_at?: string
          processed?: boolean
          signal_type: string
          signal_value?: Json
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          member_id?: string
          occurred_at?: string
          processed?: boolean
          signal_type?: string
          signal_value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "device_signals_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "member_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_signals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_deleted_by_recipient: boolean
          is_deleted_by_sender: boolean
          is_read: boolean
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_deleted_by_recipient?: boolean
          is_deleted_by_sender?: boolean
          is_read?: boolean
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_deleted_by_recipient?: boolean
          is_deleted_by_sender?: boolean
          is_read?: boolean
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      document_vault_items: {
        Row: {
          created_at: string
          description: string | null
          doc_category: string
          expires_on: string | null
          file_name: string
          file_type: string
          id: string
          is_advance_directive: boolean
          issuer: string | null
          last_reviewed_at: string | null
          member_id: string
          shared_with_navigator: boolean
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          doc_category?: string
          expires_on?: string | null
          file_name: string
          file_type: string
          id?: string
          is_advance_directive?: boolean
          issuer?: string | null
          last_reviewed_at?: string | null
          member_id: string
          shared_with_navigator?: boolean
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          doc_category?: string
          expires_on?: string | null
          file_name?: string
          file_type?: string
          id?: string
          is_advance_directive?: boolean
          issuer?: string | null
          last_reviewed_at?: string | null
          member_id?: string
          shared_with_navigator?: boolean
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_vault_items_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_vault_items_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          agency_id: string | null
          amount_cents: number
          campaign: string | null
          created_at: string
          donation_date: string
          donor_email: string | null
          donor_name: string
          employer_account_id: string | null
          id: string
          is_recurring: boolean
          notes: string | null
          org_id: string | null
          payment_method: string
          receipt_sent: boolean
        }
        Insert: {
          agency_id?: string | null
          amount_cents: number
          campaign?: string | null
          created_at?: string
          donation_date?: string
          donor_email?: string | null
          donor_name: string
          employer_account_id?: string | null
          id?: string
          is_recurring?: boolean
          notes?: string | null
          org_id?: string | null
          payment_method?: string
          receipt_sent?: boolean
        }
        Update: {
          agency_id?: string | null
          amount_cents?: number
          campaign?: string | null
          created_at?: string
          donation_date?: string
          donor_email?: string | null
          donor_name?: string
          employer_account_id?: string | null
          id?: string
          is_recurring?: boolean
          notes?: string | null
          org_id?: string | null
          payment_method?: string
          receipt_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "donations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "care_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_employer_account_id_fkey"
            columns: ["employer_account_id"]
            isOneToOne: false
            referencedRelation: "employer_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      ehr_connections: {
        Row: {
          consent_granted_at: string | null
          created_at: string
          ehr_system: string
          fhir_base_url: string | null
          id: string
          last_export_at: string | null
          member_id: string
          patient_fhir_id: string | null
          scopes: string[] | null
          status: string
        }
        Insert: {
          consent_granted_at?: string | null
          created_at?: string
          ehr_system?: string
          fhir_base_url?: string | null
          id?: string
          last_export_at?: string | null
          member_id: string
          patient_fhir_id?: string | null
          scopes?: string[] | null
          status?: string
        }
        Update: {
          consent_granted_at?: string | null
          created_at?: string
          ehr_system?: string
          fhir_base_url?: string | null
          id?: string
          last_export_at?: string | null
          member_id?: string
          patient_fhir_id?: string | null
          scopes?: string[] | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ehr_connections_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_log: {
        Row: {
          alert_type: string
          call_id: string | null
          created_at: string
          id: string
          logged_at: string
          member_id: string
          triggered_phrase: string | null
        }
        Insert: {
          alert_type: string
          call_id?: string | null
          created_at?: string
          id?: string
          logged_at?: string
          member_id: string
          triggered_phrase?: string | null
        }
        Update: {
          alert_type?: string
          call_id?: string | null
          created_at?: string
          id?: string
          logged_at?: string
          member_id?: string
          triggered_phrase?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_log_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "check_in_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_accounts: {
        Row: {
          billing_cycle: string
          billing_start_date: string | null
          company_name: string
          contact_email: string
          contact_name: string
          created_at: string
          id: string
          pepm_price_cents: number
          plan_tier: string
          seats_purchased: number
          seats_used: number
          status: string
        }
        Insert: {
          billing_cycle?: string
          billing_start_date?: string | null
          company_name: string
          contact_email: string
          contact_name: string
          created_at?: string
          id?: string
          pepm_price_cents?: number
          plan_tier?: string
          seats_purchased?: number
          seats_used?: number
          status?: string
        }
        Update: {
          billing_cycle?: string
          billing_start_date?: string | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          created_at?: string
          id?: string
          pepm_price_cents?: number
          plan_tier?: string
          seats_purchased?: number
          seats_used?: number
          status?: string
        }
        Relationships: []
      }
      employer_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by_auth_id: string | null
          created_at: string
          email: string
          employer_account_id: string
          expires_at: string
          id: string
          invited_by_auth_id: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_auth_id?: string | null
          created_at?: string
          email: string
          employer_account_id: string
          expires_at?: string
          id?: string
          invited_by_auth_id: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_auth_id?: string | null
          created_at?: string
          email?: string
          employer_account_id?: string
          expires_at?: string
          id?: string
          invited_by_auth_id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_invitations_employer_account_id_fkey"
            columns: ["employer_account_id"]
            isOneToOne: false
            referencedRelation: "employer_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_leads: {
        Row: {
          company_name: string
          company_size: string | null
          contact_name: string
          created_at: string
          email: string
          id: string
          next_follow_up_date: string | null
          notes: string | null
          phone: string | null
          status: string
        }
        Insert: {
          company_name: string
          company_size?: string | null
          contact_name: string
          created_at?: string
          email: string
          id?: string
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          company_name?: string
          company_size?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          attended: boolean
          created_at: string
          event_id: string
          id: string
          member_id: string
          rsvp_date: string
        }
        Insert: {
          attended?: boolean
          created_at?: string
          event_id: string
          id?: string
          member_id: string
          rsvp_date?: string
        }
        Update: {
          attended?: boolean
          created_at?: string
          event_id?: string
          id?: string
          member_id?: string
          rsvp_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      event_search_cache: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          query: string
          results: Json
          zip_code: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          query: string
          results: Json
          zip_code: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          query?: string
          results?: Json
          zip_code?: string
        }
        Relationships: []
      }
      event_waitlist: {
        Row: {
          created_at: string
          event_id: string
          id: string
          member_id: string
          notified_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          member_id: string
          notified_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          member_id?: string
          notified_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_waitlist_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          dial_in_code: string | null
          dial_in_number: string | null
          duration_minutes: number
          event_date: string
          event_time: string
          event_type: string
          format: Database["public"]["Enums"]["event_format"]
          host_name: string | null
          id: string
          is_recurring: boolean
          location_address: string | null
          max_capacity: number | null
          recurrence_pattern: string | null
          rsvp_count: number
          status: Database["public"]["Enums"]["event_status"]
          timezone: string
          title: string
          video_link: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          dial_in_code?: string | null
          dial_in_number?: string | null
          duration_minutes?: number
          event_date: string
          event_time: string
          event_type?: string
          format?: Database["public"]["Enums"]["event_format"]
          host_name?: string | null
          id?: string
          is_recurring?: boolean
          location_address?: string | null
          max_capacity?: number | null
          recurrence_pattern?: string | null
          rsvp_count?: number
          status?: Database["public"]["Enums"]["event_status"]
          timezone?: string
          title: string
          video_link?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          dial_in_code?: string | null
          dial_in_number?: string | null
          duration_minutes?: number
          event_date?: string
          event_time?: string
          event_type?: string
          format?: Database["public"]["Enums"]["event_format"]
          host_name?: string | null
          id?: string
          is_recurring?: boolean
          location_address?: string | null
          max_capacity?: number | null
          recurrence_pattern?: string | null
          rsvp_count?: number
          status?: Database["public"]["Enums"]["event_status"]
          timezone?: string
          title?: string
          video_link?: string | null
        }
        Relationships: []
      }
      fall_events: {
        Row: {
          alert_id: string | null
          confidence: number | null
          created_at: string
          detected_at: string
          device_id: string | null
          id: string
          member_id: string
          navigator_task_id: string | null
          raw: Json
          resolution_note: string | null
          resolved: boolean
          resolved_at: string | null
          source: string
        }
        Insert: {
          alert_id?: string | null
          confidence?: number | null
          created_at?: string
          detected_at?: string
          device_id?: string | null
          id?: string
          member_id: string
          navigator_task_id?: string | null
          raw?: Json
          resolution_note?: string | null
          resolved?: boolean
          resolved_at?: string | null
          source?: string
        }
        Update: {
          alert_id?: string | null
          confidence?: number | null
          created_at?: string
          detected_at?: string
          device_id?: string | null
          id?: string
          member_id?: string
          navigator_task_id?: string | null
          raw?: Json
          resolution_note?: string | null
          resolved?: boolean
          resolved_at?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "fall_events_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fall_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "member_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fall_events_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fall_events_navigator_task_id_fkey"
            columns: ["navigator_task_id"]
            isOneToOne: false
            referencedRelation: "navigator_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      fall_risk_scores: {
        Row: {
          computed_at: string
          contributing_factors: Json
          created_at: string
          id: string
          member_id: string
          model: string
          navigator_task_id: string | null
          risk_band: string
          risk_probability: number
        }
        Insert: {
          computed_at?: string
          contributing_factors?: Json
          created_at?: string
          id?: string
          member_id: string
          model?: string
          navigator_task_id?: string | null
          risk_band?: string
          risk_probability?: number
        }
        Update: {
          computed_at?: string
          contributing_factors?: Json
          created_at?: string
          id?: string
          member_id?: string
          model?: string
          navigator_task_id?: string | null
          risk_band?: string
          risk_probability?: number
        }
        Relationships: [
          {
            foreignKeyName: "fall_risk_scores_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fall_risk_scores_navigator_task_id_fkey"
            columns: ["navigator_task_id"]
            isOneToOne: false
            referencedRelation: "navigator_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          aaa_id: string | null
          agency_id: string | null
          alert_level: string
          created_at: string
          email: string
          employer_account_id: string | null
          full_name: string
          id: string
          last_login_at: string | null
          member_id: string | null
          network_id: string | null
          notification_prefs: Json
          org_id: string | null
          phone: string | null
          referring_agency_id: string | null
          relationship: string | null
          role: Database["public"]["Enums"]["user_role"]
          senior_center_id: string | null
          supabase_auth_id: string
          university_name: string | null
        }
        Insert: {
          aaa_id?: string | null
          agency_id?: string | null
          alert_level?: string
          created_at?: string
          email: string
          employer_account_id?: string | null
          full_name: string
          id?: string
          last_login_at?: string | null
          member_id?: string | null
          network_id?: string | null
          notification_prefs?: Json
          org_id?: string | null
          phone?: string | null
          referring_agency_id?: string | null
          relationship?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          senior_center_id?: string | null
          supabase_auth_id: string
          university_name?: string | null
        }
        Update: {
          aaa_id?: string | null
          agency_id?: string | null
          alert_level?: string
          created_at?: string
          email?: string
          employer_account_id?: string | null
          full_name?: string
          id?: string
          last_login_at?: string | null
          member_id?: string | null
          network_id?: string | null
          notification_prefs?: Json
          org_id?: string | null
          phone?: string | null
          referring_agency_id?: string | null
          relationship?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          senior_center_id?: string | null
          supabase_auth_id?: string
          university_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "care_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_employer_account_id_fkey"
            columns: ["employer_account_id"]
            isOneToOne: false
            referencedRelation: "employer_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "network_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_referring_agency_id_fkey"
            columns: ["referring_agency_id"]
            isOneToOne: false
            referencedRelation: "care_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_senior_center_id_fkey"
            columns: ["senior_center_id"]
            isOneToOne: false
            referencedRelation: "senior_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_family_members_aaa_id"
            columns: ["aaa_id"]
            isOneToOne: false
            referencedRelation: "area_agencies_on_aging"
            referencedColumns: ["id"]
          },
        ]
      }
      family_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          member_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          member_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          member_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_messages_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_task_items: {
        Row: {
          assigned_to: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          created_by: string
          due_date: string | null
          id: string
          member_id: string
          task_type: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by: string
          due_date?: string | null
          id?: string
          member_id: string
          task_type?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string
          due_date?: string | null
          id?: string
          member_id?: string
          task_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_task_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_task_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_task_items_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_volunteer_links: {
        Row: {
          created_at: string
          family_member_id: string
          id: string
          linked_member_id: string
          volunteer_id: string
        }
        Insert: {
          created_at?: string
          family_member_id: string
          id?: string
          linked_member_id: string
          volunteer_id: string
        }
        Update: {
          created_at?: string
          family_member_id?: string
          id?: string
          linked_member_id?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_volunteer_links_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_volunteer_links_linked_member_id_fkey"
            columns: ["linked_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_volunteer_links_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      fhir_export_log: {
        Row: {
          connection_id: string | null
          created_at: string
          export_status: string
          id: string
          member_id: string
          payload_summary: string | null
          resource_count: number
          resource_type: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          export_status?: string
          id?: string
          member_id: string
          payload_summary?: string | null
          resource_count?: number
          resource_type: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          export_status?: string
          id?: string
          member_id?: string
          payload_summary?: string | null
          resource_count?: number
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fhir_export_log_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "ehr_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fhir_export_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      grief_pattern_flags: {
        Row: {
          computed_at: string
          created_at: string
          grief_request_id: string | null
          id: string
          indicators: string[] | null
          member_id: string
          months_since_loss: number | null
          navigator_task_id: string | null
          pgd_risk: boolean
          professional_referral_suggested: boolean
          risk_band: string
        }
        Insert: {
          computed_at?: string
          created_at?: string
          grief_request_id?: string | null
          id?: string
          indicators?: string[] | null
          member_id: string
          months_since_loss?: number | null
          navigator_task_id?: string | null
          pgd_risk?: boolean
          professional_referral_suggested?: boolean
          risk_band?: string
        }
        Update: {
          computed_at?: string
          created_at?: string
          grief_request_id?: string | null
          id?: string
          indicators?: string[] | null
          member_id?: string
          months_since_loss?: number | null
          navigator_task_id?: string | null
          pgd_risk?: boolean
          professional_referral_suggested?: boolean
          risk_band?: string
        }
        Relationships: [
          {
            foreignKeyName: "grief_pattern_flags_grief_request_id_fkey"
            columns: ["grief_request_id"]
            isOneToOne: false
            referencedRelation: "grief_support_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grief_pattern_flags_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grief_pattern_flags_navigator_task_id_fkey"
            columns: ["navigator_task_id"]
            isOneToOne: false
            referencedRelation: "navigator_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      grief_support_requests: {
        Row: {
          additional_notes: string | null
          availability_preference: string | null
          circle_type_requested: string | null
          created_at: string
          id: string
          loss_anniversary_date: string | null
          loss_type: string
          matched_at: string | null
          member_id: string
          navigator_notes: string | null
          status: string
        }
        Insert: {
          additional_notes?: string | null
          availability_preference?: string | null
          circle_type_requested?: string | null
          created_at?: string
          id?: string
          loss_anniversary_date?: string | null
          loss_type: string
          matched_at?: string | null
          member_id: string
          navigator_notes?: string | null
          status?: string
        }
        Update: {
          additional_notes?: string | null
          availability_preference?: string | null
          circle_type_requested?: string | null
          created_at?: string
          id?: string
          loss_anniversary_date?: string | null
          loss_type?: string
          matched_at?: string | null
          member_id?: string
          navigator_notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "grief_support_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      heritage_projects: {
        Row: {
          created_at: string
          elder_notes: string | null
          format: string
          id: string
          life_story_entry_id: string | null
          member_id: string
          project_description: string | null
          saved_to_life_story: boolean
          scheduled_at: string | null
          school_name: string | null
          status: string
          student_reflection: string | null
          student_volunteer_id: string | null
          tradition_topic: string
        }
        Insert: {
          created_at?: string
          elder_notes?: string | null
          format?: string
          id?: string
          life_story_entry_id?: string | null
          member_id: string
          project_description?: string | null
          saved_to_life_story?: boolean
          scheduled_at?: string | null
          school_name?: string | null
          status?: string
          student_reflection?: string | null
          student_volunteer_id?: string | null
          tradition_topic: string
        }
        Update: {
          created_at?: string
          elder_notes?: string | null
          format?: string
          id?: string
          life_story_entry_id?: string | null
          member_id?: string
          project_description?: string | null
          saved_to_life_story?: boolean
          scheduled_at?: string | null
          school_name?: string | null
          status?: string
          student_reflection?: string | null
          student_volunteer_id?: string | null
          tradition_topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "heritage_projects_life_story_entry_id_fkey"
            columns: ["life_story_entry_id"]
            isOneToOne: false
            referencedRelation: "life_story_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heritage_projects_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heritage_projects_student_volunteer_id_fkey"
            columns: ["student_volunteer_id"]
            isOneToOne: false
            referencedRelation: "student_volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_call_log: {
        Row: {
          agent_name: string
          agents_involved: string[]
          ai_summary: string | null
          caller_role: string
          created_at: string
          duration_seconds: number | null
          family_member_id: string | null
          from_number: string | null
          id: string
          needs_followup: boolean
          retell_call_id: string | null
          transcript: string | null
          volunteer_id: string | null
        }
        Insert: {
          agent_name: string
          agents_involved?: string[]
          ai_summary?: string | null
          caller_role?: string
          created_at?: string
          duration_seconds?: number | null
          family_member_id?: string | null
          from_number?: string | null
          id?: string
          needs_followup?: boolean
          retell_call_id?: string | null
          transcript?: string | null
          volunteer_id?: string | null
        }
        Update: {
          agent_name?: string
          agents_involved?: string[]
          ai_summary?: string | null
          caller_role?: string
          created_at?: string
          duration_seconds?: number | null
          family_member_id?: string | null
          from_number?: string | null
          id?: string
          needs_followup?: boolean
          retell_call_id?: string | null
          transcript?: string | null
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inbound_call_log_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      isolation_scores: {
        Row: {
          computed_at: string
          created_at: string
          drivers: string[] | null
          engagement_trend: number | null
          id: string
          isolation_score: number
          member_id: string
          navigator_task_id: string | null
          risk_band: string
          sentiment_valence: number | null
          suggested_connections: Json
        }
        Insert: {
          computed_at?: string
          created_at?: string
          drivers?: string[] | null
          engagement_trend?: number | null
          id?: string
          isolation_score?: number
          member_id: string
          navigator_task_id?: string | null
          risk_band?: string
          sentiment_valence?: number | null
          suggested_connections?: Json
        }
        Update: {
          computed_at?: string
          created_at?: string
          drivers?: string[] | null
          engagement_trend?: number | null
          id?: string
          isolation_score?: number
          member_id?: string
          navigator_task_id?: string | null
          risk_band?: string
          sentiment_valence?: number | null
          suggested_connections?: Json
        }
        Relationships: [
          {
            foreignKeyName: "isolation_scores_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "isolation_scores_navigator_task_id_fkey"
            columns: ["navigator_task_id"]
            isOneToOne: false
            referencedRelation: "navigator_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      k12_schools: {
        Row: {
          active_student_count: number
          city: string | null
          contact_email: string
          contact_name: string
          created_at: string
          grade_levels: string[] | null
          id: string
          program_types: string[] | null
          school_name: string
          school_type: string
          state: string | null
          status: string
        }
        Insert: {
          active_student_count?: number
          city?: string | null
          contact_email: string
          contact_name: string
          created_at?: string
          grade_levels?: string[] | null
          id?: string
          program_types?: string[] | null
          school_name: string
          school_type?: string
          state?: string | null
          status?: string
        }
        Update: {
          active_student_count?: number
          city?: string | null
          contact_email?: string
          contact_name?: string
          created_at?: string
          grade_levels?: string[] | null
          id?: string
          program_types?: string[] | null
          school_name?: string
          school_type?: string
          state?: string | null
          status?: string
        }
        Relationships: []
      }
      k12_student_volunteers: {
        Row: {
          created_at: string
          grade_level: string | null
          id: string
          member_id: string | null
          program_type: string
          school_id: string
          sessions_completed: number
          status: string
          student_name: string
          total_hours_logged: number
        }
        Insert: {
          created_at?: string
          grade_level?: string | null
          id?: string
          member_id?: string | null
          program_type: string
          school_id: string
          sessions_completed?: number
          status?: string
          student_name: string
          total_hours_logged?: number
        }
        Update: {
          created_at?: string
          grade_level?: string | null
          id?: string
          member_id?: string | null
          program_type?: string
          school_id?: string
          sessions_completed?: number
          status?: string
          student_name?: string
          total_hours_logged?: number
        }
        Relationships: [
          {
            foreignKeyName: "k12_student_volunteers_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "k12_student_volunteers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "k12_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_consultations: {
        Row: {
          advisor_id: string | null
          created_at: string
          id: string
          member_addon_id: string | null
          member_id: string
          navigator_id: string | null
          navigator_task_id: string | null
          notes: string | null
          requested_by: string | null
          scheduled_for: string | null
          status: string
          topic: string | null
        }
        Insert: {
          advisor_id?: string | null
          created_at?: string
          id?: string
          member_addon_id?: string | null
          member_id: string
          navigator_id?: string | null
          navigator_task_id?: string | null
          notes?: string | null
          requested_by?: string | null
          scheduled_for?: string | null
          status?: string
          topic?: string | null
        }
        Update: {
          advisor_id?: string | null
          created_at?: string
          id?: string
          member_addon_id?: string | null
          member_id?: string
          navigator_id?: string | null
          navigator_task_id?: string | null
          notes?: string | null
          requested_by?: string | null
          scheduled_for?: string | null
          status?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_consultations_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "trusted_advisors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_consultations_member_addon_id_fkey"
            columns: ["member_addon_id"]
            isOneToOne: false
            referencedRelation: "member_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_consultations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_consultations_navigator_id_fkey"
            columns: ["navigator_id"]
            isOneToOne: false
            referencedRelation: "care_navigators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_consultations_navigator_task_id_fkey"
            columns: ["navigator_task_id"]
            isOneToOne: false
            referencedRelation: "navigator_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_consultations_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      life_story_entries: {
        Row: {
          attachments: string[] | null
          content: string
          created_at: string
          created_by: string | null
          entry_type: string
          era: string | null
          id: string
          is_private: boolean
          member_id: string
          title: string
        }
        Insert: {
          attachments?: string[] | null
          content: string
          created_at?: string
          created_by?: string | null
          entry_type?: string
          era?: string | null
          id?: string
          is_private?: boolean
          member_id: string
          title: string
        }
        Update: {
          attachments?: string[] | null
          content?: string
          created_at?: string
          created_by?: string | null
          entry_type?: string
          era?: string | null
          id?: string
          is_private?: boolean
          member_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_story_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "life_story_entries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      live_event_rsvps: {
        Row: {
          created_at: string
          event_date: string | null
          event_title: string
          event_url: string
          id: string
          member_id: string
        }
        Insert: {
          created_at?: string
          event_date?: string | null
          event_title: string
          event_url: string
          id?: string
          member_id: string
        }
        Update: {
          created_at?: string
          event_date?: string | null
          event_title?: string
          event_url?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_event_rsvps_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_schedules: {
        Row: {
          created_at: string
          days_of_week: string[]
          id: string
          is_active: boolean
          label: string
          member_id: string
          reminder_time: string
        }
        Insert: {
          created_at?: string
          days_of_week?: string[]
          id?: string
          is_active?: boolean
          label?: string
          member_id: string
          reminder_time: string
        }
        Update: {
          created_at?: string
          days_of_week?: string[]
          id?: string
          is_active?: boolean
          label?: string
          member_id?: string
          reminder_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_schedules_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_addons: {
        Row: {
          addon_id: string
          addon_key: string
          billing: Database["public"]["Enums"]["addon_billing"]
          cancelled_at: string | null
          created_at: string
          fulfilled_at: string | null
          id: string
          member_id: string
          metadata: Json
          navigator_task_id: string | null
          note: string | null
          price_cents: number
          purchased_by: string | null
          renews_at: string | null
          started_at: string
          status: Database["public"]["Enums"]["addon_purchase_status"]
          stripe_subscription_id: string | null
        }
        Insert: {
          addon_id: string
          addon_key: string
          billing?: Database["public"]["Enums"]["addon_billing"]
          cancelled_at?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          member_id: string
          metadata?: Json
          navigator_task_id?: string | null
          note?: string | null
          price_cents: number
          purchased_by?: string | null
          renews_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["addon_purchase_status"]
          stripe_subscription_id?: string | null
        }
        Update: {
          addon_id?: string
          addon_key?: string
          billing?: Database["public"]["Enums"]["addon_billing"]
          cancelled_at?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          member_id?: string
          metadata?: Json
          navigator_task_id?: string | null
          note?: string | null
          price_cents?: number
          purchased_by?: string | null
          renews_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["addon_purchase_status"]
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "premium_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_addons_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_addons_navigator_task_id_fkey"
            columns: ["navigator_task_id"]
            isOneToOne: false
            referencedRelation: "navigator_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_addons_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_ambassadors: {
        Row: {
          ambassador_since: string
          created_at: string
          id: string
          member_id: string
          nominated_by: string | null
          notes: string | null
          specialties: string[] | null
          status: string
          total_events_hosted: number
          total_new_members_welcomed: number
        }
        Insert: {
          ambassador_since?: string
          created_at?: string
          id?: string
          member_id: string
          nominated_by?: string | null
          notes?: string | null
          specialties?: string[] | null
          status?: string
          total_events_hosted?: number
          total_new_members_welcomed?: number
        }
        Update: {
          ambassador_since?: string
          created_at?: string
          id?: string
          member_id?: string
          nominated_by?: string | null
          notes?: string | null
          specialties?: string[] | null
          status?: string
          total_events_hosted?: number
          total_new_members_welcomed?: number
        }
        Relationships: [
          {
            foreignKeyName: "member_ambassadors_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_ambassadors_nominated_by_fkey"
            columns: ["nominated_by"]
            isOneToOne: false
            referencedRelation: "care_navigators"
            referencedColumns: ["id"]
          },
        ]
      }
      member_connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_connections_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_devices: {
        Row: {
          billing_option: string
          created_at: string
          device_category: string
          device_name: string | null
          device_type: string
          external_account_id: string | null
          id: string
          last_sync_at: string | null
          member_id: string
          notes: string | null
          provider: string | null
          settings: Json
          status: string
        }
        Insert: {
          billing_option?: string
          created_at?: string
          device_category?: string
          device_name?: string | null
          device_type: string
          external_account_id?: string | null
          id?: string
          last_sync_at?: string | null
          member_id: string
          notes?: string | null
          provider?: string | null
          settings?: Json
          status?: string
        }
        Update: {
          billing_option?: string
          created_at?: string
          device_category?: string
          device_name?: string | null
          device_type?: string
          external_account_id?: string | null
          id?: string
          last_sync_at?: string | null
          member_id?: string
          notes?: string | null
          provider?: string | null
          settings?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_devices_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_needs: {
        Row: {
          claimed_at: string | null
          claimed_by_volunteer_id: string | null
          community_context: string | null
          created_at: string
          description: string
          fulfilled_at: string | null
          fulfillment_notes: string | null
          id: string
          member_id: string
          need_type: string
          org_id: string
          preferred_date: string | null
          preferred_time: string | null
          status: Database["public"]["Enums"]["member_need_status"]
          title: string
          urgency: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by_volunteer_id?: string | null
          community_context?: string | null
          created_at?: string
          description: string
          fulfilled_at?: string | null
          fulfillment_notes?: string | null
          id?: string
          member_id: string
          need_type?: string
          org_id: string
          preferred_date?: string | null
          preferred_time?: string | null
          status?: Database["public"]["Enums"]["member_need_status"]
          title: string
          urgency?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by_volunteer_id?: string | null
          community_context?: string | null
          created_at?: string
          description?: string
          fulfilled_at?: string | null
          fulfillment_notes?: string | null
          id?: string
          member_id?: string
          need_type?: string
          org_id?: string
          preferred_date?: string | null
          preferred_time?: string | null
          status?: Database["public"]["Enums"]["member_need_status"]
          title?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_needs_claimed_by_volunteer_id_fkey"
            columns: ["claimed_by_volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_needs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_needs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      member_pets: {
        Row: {
          added_by: string | null
          adoption_date: string | null
          birth_date: string | null
          breed: string | null
          color_markings: string | null
          created_at: string
          id: string
          is_active: boolean
          member_id: string
          memorial_note: string | null
          name: string
          notes: string | null
          passed_away_on: string | null
          photo_path: string | null
          species: string
        }
        Insert: {
          added_by?: string | null
          adoption_date?: string | null
          birth_date?: string | null
          breed?: string | null
          color_markings?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          member_id: string
          memorial_note?: string | null
          name: string
          notes?: string | null
          passed_away_on?: string | null
          photo_path?: string | null
          species?: string
        }
        Update: {
          added_by?: string | null
          adoption_date?: string | null
          birth_date?: string | null
          breed?: string | null
          color_markings?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          member_id?: string
          memorial_note?: string | null
          name?: string
          notes?: string | null
          passed_away_on?: string | null
          photo_path?: string | null
          species?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_pets_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_pets_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          aria_call_opted_in: boolean
          buddy_call_length_preference: string | null
          buddy_intro_note: string | null
          buddy_match_era: string | null
          buddy_match_topics: string[] | null
          call_frequency_preference: string
          check_in_frequency: Database["public"]["Enums"]["check_in_frequency"]
          checkin_preference: string
          created_at: string
          date_of_birth: string
          device_integration_consent: boolean
          directory_bio: string | null
          directory_opt_in: boolean
          doctor_name: string | null
          doctor_phone: string | null
          emergency_contact_1_name: string | null
          emergency_contact_1_phone: string | null
          emergency_contact_1_rel: string | null
          emergency_contact_2_name: string | null
          emergency_contact_2_phone: string | null
          emergency_contact_2_rel: string | null
          faith_preference: string | null
          family_can_see_alerts: boolean
          family_can_see_call_summaries: boolean
          family_can_see_mood: boolean
          family_can_see_service_history: boolean
          full_name: string
          grief_enrolled_at: string | null
          grief_loss_type: string | null
          grief_welcome_path: boolean
          has_active_buddy: boolean
          health_conditions: string | null
          id: string
          last_aria_call_at: string | null
          lives_alone: boolean | null
          medications: string | null
          ml_insights_opt_out: boolean
          mobility_devices: string[] | null
          onboarding_call_attempts: number
          onboarding_call_completed: boolean
          onboarding_call_scheduled_at: string | null
          phone_number: string
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          preferred_call_time: string | null
          preferred_contact_method: string
          preferred_language: string
          preferred_name: string
          risk_override_calls: boolean
          status: Database["public"]["Enums"]["member_status"]
          supabase_auth_id: string | null
          timezone: string
          topics_avoid: string | null
          topics_enjoy: string[] | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          aria_call_opted_in?: boolean
          buddy_call_length_preference?: string | null
          buddy_intro_note?: string | null
          buddy_match_era?: string | null
          buddy_match_topics?: string[] | null
          call_frequency_preference?: string
          check_in_frequency?: Database["public"]["Enums"]["check_in_frequency"]
          checkin_preference?: string
          created_at?: string
          date_of_birth: string
          device_integration_consent?: boolean
          directory_bio?: string | null
          directory_opt_in?: boolean
          doctor_name?: string | null
          doctor_phone?: string | null
          emergency_contact_1_name?: string | null
          emergency_contact_1_phone?: string | null
          emergency_contact_1_rel?: string | null
          emergency_contact_2_name?: string | null
          emergency_contact_2_phone?: string | null
          emergency_contact_2_rel?: string | null
          faith_preference?: string | null
          family_can_see_alerts?: boolean
          family_can_see_call_summaries?: boolean
          family_can_see_mood?: boolean
          family_can_see_service_history?: boolean
          full_name: string
          grief_enrolled_at?: string | null
          grief_loss_type?: string | null
          grief_welcome_path?: boolean
          has_active_buddy?: boolean
          health_conditions?: string | null
          id?: string
          last_aria_call_at?: string | null
          lives_alone?: boolean | null
          medications?: string | null
          ml_insights_opt_out?: boolean
          mobility_devices?: string[] | null
          onboarding_call_attempts?: number
          onboarding_call_completed?: boolean
          onboarding_call_scheduled_at?: string | null
          phone_number: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          preferred_call_time?: string | null
          preferred_contact_method?: string
          preferred_language?: string
          preferred_name: string
          risk_override_calls?: boolean
          status?: Database["public"]["Enums"]["member_status"]
          supabase_auth_id?: string | null
          timezone?: string
          topics_avoid?: string | null
          topics_enjoy?: string[] | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          aria_call_opted_in?: boolean
          buddy_call_length_preference?: string | null
          buddy_intro_note?: string | null
          buddy_match_era?: string | null
          buddy_match_topics?: string[] | null
          call_frequency_preference?: string
          check_in_frequency?: Database["public"]["Enums"]["check_in_frequency"]
          checkin_preference?: string
          created_at?: string
          date_of_birth?: string
          device_integration_consent?: boolean
          directory_bio?: string | null
          directory_opt_in?: boolean
          doctor_name?: string | null
          doctor_phone?: string | null
          emergency_contact_1_name?: string | null
          emergency_contact_1_phone?: string | null
          emergency_contact_1_rel?: string | null
          emergency_contact_2_name?: string | null
          emergency_contact_2_phone?: string | null
          emergency_contact_2_rel?: string | null
          faith_preference?: string | null
          family_can_see_alerts?: boolean
          family_can_see_call_summaries?: boolean
          family_can_see_mood?: boolean
          family_can_see_service_history?: boolean
          full_name?: string
          grief_enrolled_at?: string | null
          grief_loss_type?: string | null
          grief_welcome_path?: boolean
          has_active_buddy?: boolean
          health_conditions?: string | null
          id?: string
          last_aria_call_at?: string | null
          lives_alone?: boolean | null
          medications?: string | null
          ml_insights_opt_out?: boolean
          mobility_devices?: string[] | null
          onboarding_call_attempts?: number
          onboarding_call_completed?: boolean
          onboarding_call_scheduled_at?: string | null
          phone_number?: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          preferred_call_time?: string | null
          preferred_contact_method?: string
          preferred_language?: string
          preferred_name?: string
          risk_override_calls?: boolean
          status?: Database["public"]["Enums"]["member_status"]
          supabase_auth_id?: string | null
          timezone?: string
          topics_avoid?: string | null
          topics_enjoy?: string[] | null
          zip_code?: string | null
        }
        Relationships: []
      }
      memory_book_orders: {
        Row: {
          created_at: string
          dedication_text: string | null
          goods_order_ref: string | null
          id: string
          member_addon_id: string | null
          member_id: string
          milestone_age: number
          navigator_task_id: string | null
          ordered_by: string | null
          photo_paths: string[]
          recipient_address: string | null
          recipient_name: string | null
          status: string
          tracking_note: string | null
        }
        Insert: {
          created_at?: string
          dedication_text?: string | null
          goods_order_ref?: string | null
          id?: string
          member_addon_id?: string | null
          member_id: string
          milestone_age: number
          navigator_task_id?: string | null
          ordered_by?: string | null
          photo_paths?: string[]
          recipient_address?: string | null
          recipient_name?: string | null
          status?: string
          tracking_note?: string | null
        }
        Update: {
          created_at?: string
          dedication_text?: string | null
          goods_order_ref?: string | null
          id?: string
          member_addon_id?: string | null
          member_id?: string
          milestone_age?: number
          navigator_task_id?: string | null
          ordered_by?: string | null
          photo_paths?: string[]
          recipient_address?: string | null
          recipient_name?: string | null
          status?: string
          tracking_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_book_orders_member_addon_id_fkey"
            columns: ["member_addon_id"]
            isOneToOne: false
            referencedRelation: "member_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_book_orders_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_book_orders_navigator_task_id_fkey"
            columns: ["navigator_task_id"]
            isOneToOne: false
            referencedRelation: "navigator_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_book_orders_ordered_by_fkey"
            columns: ["ordered_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_books: {
        Row: {
          collage_storage_path: string | null
          cover_photo_path: string | null
          created_at: string
          dedication: string | null
          entry_ids: string[]
          format_type: string
          id: string
          layout_style: string
          member_id: string
          page_count: number | null
          purchase_date: string | null
          regeneration_count: number
          status: string
          storage_path: string | null
          title: string
        }
        Insert: {
          collage_storage_path?: string | null
          cover_photo_path?: string | null
          created_at?: string
          dedication?: string | null
          entry_ids?: string[]
          format_type?: string
          id?: string
          layout_style?: string
          member_id: string
          page_count?: number | null
          purchase_date?: string | null
          regeneration_count?: number
          status?: string
          storage_path?: string | null
          title?: string
        }
        Update: {
          collage_storage_path?: string | null
          cover_photo_path?: string | null
          created_at?: string
          dedication?: string | null
          entry_ids?: string[]
          format_type?: string
          id?: string
          layout_style?: string
          member_id?: string
          page_count?: number | null
          purchase_date?: string | null
          regeneration_count?: number
          status?: string
          storage_path?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_books_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      navigator_assignments: {
        Row: {
          assigned_at: string
          created_at: string
          id: string
          is_primary: boolean
          member_id: string
          navigator_id: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          member_id: string
          navigator_id: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          member_id?: string
          navigator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigator_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigator_assignments_navigator_id_fkey"
            columns: ["navigator_id"]
            isOneToOne: false
            referencedRelation: "care_navigators"
            referencedColumns: ["id"]
          },
        ]
      }
      navigator_notes: {
        Row: {
          created_at: string
          id: string
          member_id: string
          navigator_id: string
          note: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          navigator_id: string
          note: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          navigator_id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigator_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigator_notes_navigator_id_fkey"
            columns: ["navigator_id"]
            isOneToOne: false
            referencedRelation: "care_navigators"
            referencedColumns: ["id"]
          },
        ]
      }
      navigator_tasks: {
        Row: {
          caller_phone: string | null
          caller_role: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string
          due_by: string | null
          id: string
          member_id: string | null
          navigator_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          task_type: string
        }
        Insert: {
          caller_phone?: string | null
          caller_role?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description: string
          due_by?: string | null
          id?: string
          member_id?: string | null
          navigator_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          task_type: string
        }
        Update: {
          caller_phone?: string | null
          caller_role?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string
          due_by?: string | null
          id?: string
          member_id?: string | null
          navigator_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigator_tasks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigator_tasks_navigator_id_fkey"
            columns: ["navigator_id"]
            isOneToOne: false
            referencedRelation: "care_navigators"
            referencedColumns: ["id"]
          },
        ]
      }
      network_accounts: {
        Row: {
          contact_email: string
          contact_name: string
          created_at: string
          dues_per_org_per_year_cents: number
          id: string
          member_org_count: number
          name: string
          network_type: string
          status: string
          total_members_served: number
          website: string | null
        }
        Insert: {
          contact_email: string
          contact_name: string
          created_at?: string
          dues_per_org_per_year_cents?: number
          id?: string
          member_org_count?: number
          name: string
          network_type?: string
          status?: string
          total_members_served?: number
          website?: string | null
        }
        Update: {
          contact_email?: string
          contact_name?: string
          created_at?: string
          dues_per_org_per_year_cents?: number
          id?: string
          member_org_count?: number
          name?: string
          network_type?: string
          status?: string
          total_members_served?: number
          website?: string | null
        }
        Relationships: []
      }
      network_dues: {
        Row: {
          amount_cents: number
          created_at: string
          due_date: string
          fiscal_year: number
          id: string
          network_id: string
          org_id: string
          paid_date: string | null
          payment_notes: string | null
          status: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          due_date: string
          fiscal_year: number
          id?: string
          network_id: string
          org_id: string
          paid_date?: string | null
          payment_notes?: string | null
          status?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          due_date?: string
          fiscal_year?: number
          id?: string
          network_id?: string
          org_id?: string
          paid_date?: string | null
          payment_notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_dues_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "network_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_dues_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          channel: Database["public"]["Enums"]["notif_channel"]
          created_at: string
          error_message: string | null
          family_member_id: string | null
          id: string
          member_id: string
          message_preview: string | null
          status: Database["public"]["Enums"]["notif_status"]
        }
        Insert: {
          channel: Database["public"]["Enums"]["notif_channel"]
          created_at?: string
          error_message?: string | null
          family_member_id?: string | null
          id?: string
          member_id: string
          message_preview?: string | null
          status: Database["public"]["Enums"]["notif_status"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["notif_channel"]
          created_at?: string
          error_message?: string | null
          family_member_id?: string | null
          id?: string
          member_id?: string
          message_preview?: string | null
          status?: Database["public"]["Enums"]["notif_status"]
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      oaa_client_assessments: {
        Row: {
          aaa_id: string
          age_group: string | null
          at_risk_institutional: boolean
          county: string | null
          created_at: string
          disability_status: boolean
          gender: string | null
          id: string
          last_assessed_at: string | null
          lives_alone: boolean | null
          member_id: string
          minority_status: boolean
          nutritional_risk: boolean
          poverty_status: boolean
          primary_language: string | null
          race_ethnicity: string | null
          rural_status: boolean
          updated_at: string
        }
        Insert: {
          aaa_id: string
          age_group?: string | null
          at_risk_institutional?: boolean
          county?: string | null
          created_at?: string
          disability_status?: boolean
          gender?: string | null
          id?: string
          last_assessed_at?: string | null
          lives_alone?: boolean | null
          member_id: string
          minority_status?: boolean
          nutritional_risk?: boolean
          poverty_status?: boolean
          primary_language?: string | null
          race_ethnicity?: string | null
          rural_status?: boolean
          updated_at?: string
        }
        Update: {
          aaa_id?: string
          age_group?: string | null
          at_risk_institutional?: boolean
          county?: string | null
          created_at?: string
          disability_status?: boolean
          gender?: string | null
          id?: string
          last_assessed_at?: string | null
          lives_alone?: boolean | null
          member_id?: string
          minority_status?: boolean
          nutritional_risk?: boolean
          poverty_status?: boolean
          primary_language?: string | null
          race_ethnicity?: string | null
          rural_status?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oaa_client_assessments_aaa_id_fkey"
            columns: ["aaa_id"]
            isOneToOne: false
            referencedRelation: "area_agencies_on_aging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oaa_client_assessments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      oral_history_recordings: {
        Row: {
          audio_path: string | null
          consent_given: boolean
          created_at: string
          description: string | null
          duration_seconds: number | null
          era: string | null
          id: string
          language: string
          life_story_entry_id: string | null
          member_id: string
          recorded_by: string | null
          saved_to_life_story: boolean
          title: string
          topic: string | null
          transcript: string | null
          translation_en: string | null
          visibility: string
        }
        Insert: {
          audio_path?: string | null
          consent_given?: boolean
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          era?: string | null
          id?: string
          language?: string
          life_story_entry_id?: string | null
          member_id: string
          recorded_by?: string | null
          saved_to_life_story?: boolean
          title: string
          topic?: string | null
          transcript?: string | null
          translation_en?: string | null
          visibility?: string
        }
        Update: {
          audio_path?: string | null
          consent_given?: boolean
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          era?: string | null
          id?: string
          language?: string
          life_story_entry_id?: string | null
          member_id?: string
          recorded_by?: string | null
          saved_to_life_story?: boolean
          title?: string
          topic?: string | null
          transcript?: string | null
          translation_en?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "oral_history_recordings_life_story_entry_id_fkey"
            columns: ["life_story_entry_id"]
            isOneToOne: false
            referencedRelation: "life_story_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oral_history_recordings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oral_history_recordings_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      org_donations: {
        Row: {
          amount_cents: number
          created_at: string
          donation_date: string
          donor_email: string | null
          donor_name: string
          id: string
          is_anonymous: boolean
          notes: string | null
          org_id: string
          payment_method: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          donation_date?: string
          donor_email?: string | null
          donor_name: string
          id?: string
          is_anonymous?: boolean
          notes?: string | null
          org_id: string
          payment_method?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          donation_date?: string
          donor_email?: string | null
          donor_name?: string
          id?: string
          is_anonymous?: boolean
          notes?: string | null
          org_id?: string
          payment_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_donations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_factory: boolean
          last_used_at: string | null
          name: string
          org_id: string | null
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_factory?: boolean
          last_used_at?: string | null
          name: string
          org_id?: string | null
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_factory?: boolean
          last_used_at?: string | null
          name?: string
          org_id?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_email_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_join_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by_auth: string | null
          decision_note: string | null
          id: string
          member_id: string
          message: string | null
          org_id: string
          requested_by_auth: string | null
          requester_name: string | null
          status: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by_auth?: string | null
          decision_note?: string | null
          id?: string
          member_id: string
          message?: string | null
          org_id: string
          requested_by_auth?: string | null
          requester_name?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by_auth?: string | null
          decision_note?: string | null
          id?: string
          member_id?: string
          message?: string | null
          org_id?: string
          requested_by_auth?: string | null
          requester_name?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_join_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_join_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_membership_tiers: {
        Row: {
          amount_cents: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          org_id: string
          sort_order: number
          tier_name: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          org_id: string
          sort_order?: number
          tier_name: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          org_id?: string
          sort_order?: number
          tier_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_membership_tiers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_memberships: {
        Row: {
          annual_dues_paid_cents: number
          created_at: string
          dues_paid_date: string | null
          id: string
          is_active: boolean
          last_renewal_reminder_at: string | null
          last_renewal_reminder_sent: number | null
          member_id: string
          membership_tier: Database["public"]["Enums"]["org_membership_tier"]
          membership_year: number
          notes: string | null
          org_id: string
        }
        Insert: {
          annual_dues_paid_cents?: number
          created_at?: string
          dues_paid_date?: string | null
          id?: string
          is_active?: boolean
          last_renewal_reminder_at?: string | null
          last_renewal_reminder_sent?: number | null
          member_id: string
          membership_tier?: Database["public"]["Enums"]["org_membership_tier"]
          membership_year?: number
          notes?: string | null
          org_id: string
        }
        Update: {
          annual_dues_paid_cents?: number
          created_at?: string
          dues_paid_date?: string | null
          id?: string
          is_active?: boolean
          last_renewal_reminder_at?: string | null
          last_renewal_reminder_sent?: number | null
          member_id?: string
          membership_tier?: Database["public"]["Enums"]["org_membership_tier"]
          membership_year?: number
          notes?: string | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_programs: {
        Row: {
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          org_id: string
          participants_count: number
          program_name: string
          program_type: string
          schedule_description: string | null
          volunteers_enrolled: number
          volunteers_needed: number
        }
        Insert: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          org_id: string
          participants_count?: number
          program_name: string
          program_type?: string
          schedule_description?: string | null
          volunteers_enrolled?: number
          volunteers_needed?: number
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          org_id?: string
          participants_count?: number
          program_name?: string
          program_type?: string
          schedule_description?: string | null
          volunteers_enrolled?: number
          volunteers_needed?: number
        }
        Relationships: [
          {
            foreignKeyName: "org_programs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_sent_emails: {
        Row: {
          body: string
          created_at: string
          id: string
          org_id: string
          recipient_count: number
          recipient_group: string
          sent_by_name: string | null
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          org_id: string
          recipient_count?: number
          recipient_group?: string
          sent_by_name?: string | null
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          org_id?: string
          recipient_count?: number
          recipient_group?: string
          sent_by_name?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_sent_emails_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_api_keys: {
        Row: {
          api_key: string
          created_at: string
          employer_account_id: string
          id: string
          is_active: boolean
          key_name: string
          requests_date: string | null
          requests_today: number
        }
        Insert: {
          api_key: string
          created_at?: string
          employer_account_id: string
          id?: string
          is_active?: boolean
          key_name?: string
          requests_date?: string | null
          requests_today?: number
        }
        Update: {
          api_key?: string
          created_at?: string
          employer_account_id?: string
          id?: string
          is_active?: boolean
          key_name?: string
          requests_date?: string | null
          requests_today?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_api_keys_employer_account_id_fkey"
            columns: ["employer_account_id"]
            isOneToOne: false
            referencedRelation: "employer_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_loss_circle_members: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          joined_at: string
          member_id: string
          pet_remembered: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          joined_at?: string
          member_id: string
          pet_remembered?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          member_id?: string
          pet_remembered?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_loss_circle_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_loss_circle_posts: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          member_id: string
          post_type: string
        }
        Insert: {
          author_name: string
          content: string
          created_at?: string
          id?: string
          member_id: string
          post_type?: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          member_id?: string
          post_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_loss_circle_posts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_loss_support_requests: {
        Row: {
          created_at: string
          id: string
          loss_date: string | null
          matched_at: string | null
          member_id: string
          message: string | null
          navigator_notes: string | null
          navigator_task_id: string | null
          pet_id: string | null
          pet_name: string | null
          status: string
          support_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          loss_date?: string | null
          matched_at?: string | null
          member_id: string
          message?: string | null
          navigator_notes?: string | null
          navigator_task_id?: string | null
          pet_id?: string | null
          pet_name?: string | null
          status?: string
          support_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          loss_date?: string | null
          matched_at?: string | null
          member_id?: string
          message?: string | null
          navigator_notes?: string | null
          navigator_task_id?: string | null
          pet_id?: string | null
          pet_name?: string | null
          status?: string
          support_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_loss_support_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_loss_support_requests_navigator_task_id_fkey"
            columns: ["navigator_task_id"]
            isOneToOne: false
            referencedRelation: "navigator_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_loss_support_requests_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "member_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_documents: {
        Row: {
          agency_id: string | null
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string
          id: string
          member_id: string | null
          org_id: string | null
          scope: string
          storage_path: string
          title: string
          uploaded_by_name: string | null
          visibility: string
        }
        Insert: {
          agency_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          member_id?: string | null
          org_id?: string | null
          scope?: string
          storage_path: string
          title: string
          uploaded_by_name?: string | null
          visibility?: string
        }
        Update: {
          agency_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          member_id?: string | null
          org_id?: string | null
          scope?: string
          storage_path?: string
          title?: string
          uploaded_by_name?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_documents_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "care_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_documents_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      potluck_signups: {
        Row: {
          attendee_count: number
          created_at: string
          dish_category: string
          dish_name: string | null
          id: string
          member_id: string
          notes: string | null
          potluck_id: string
        }
        Insert: {
          attendee_count?: number
          created_at?: string
          dish_category?: string
          dish_name?: string | null
          id?: string
          member_id: string
          notes?: string | null
          potluck_id: string
        }
        Update: {
          attendee_count?: number
          created_at?: string
          dish_category?: string
          dish_name?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          potluck_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "potluck_signups_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potluck_signups_potluck_id_fkey"
            columns: ["potluck_id"]
            isOneToOne: false
            referencedRelation: "cultural_potlucks"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_addons: {
        Row: {
          addon_key: string
          benefits: string[]
          billing: Database["public"]["Enums"]["addon_billing"]
          created_at: string
          description: string
          family_seat_bonus: number
          fulfillment: string
          id: string
          is_active: boolean
          min_plan_tier: string | null
          name: string
          price_cents: number
          sort_order: number
          tagline: string | null
        }
        Insert: {
          addon_key: string
          benefits?: string[]
          billing?: Database["public"]["Enums"]["addon_billing"]
          created_at?: string
          description: string
          family_seat_bonus?: number
          fulfillment?: string
          id?: string
          is_active?: boolean
          min_plan_tier?: string | null
          name: string
          price_cents: number
          sort_order?: number
          tagline?: string | null
        }
        Update: {
          addon_key?: string
          benefits?: string[]
          billing?: Database["public"]["Enums"]["addon_billing"]
          created_at?: string
          description?: string
          family_seat_bonus?: number
          fulfillment?: string
          id?: string
          is_active?: boolean
          min_plan_tier?: string | null
          name?: string
          price_cents?: number
          sort_order?: number
          tagline?: string | null
        }
        Relationships: []
      }
      realtime_notifications: {
        Row: {
          alert_id: string | null
          body: string
          call_id: string | null
          created_at: string
          id: string
          member_id: string
          read: boolean
          read_at: string | null
          severity: Database["public"]["Enums"]["notif_severity"]
          title: string
          type: Database["public"]["Enums"]["notif_type"]
        }
        Insert: {
          alert_id?: string | null
          body: string
          call_id?: string | null
          created_at?: string
          id?: string
          member_id: string
          read?: boolean
          read_at?: string | null
          severity?: Database["public"]["Enums"]["notif_severity"]
          title: string
          type: Database["public"]["Enums"]["notif_type"]
        }
        Update: {
          alert_id?: string | null
          body?: string
          call_id?: string | null
          created_at?: string
          id?: string
          member_id?: string
          read?: boolean
          read_at?: string | null
          severity?: Database["public"]["Enums"]["notif_severity"]
          title?: string
          type?: Database["public"]["Enums"]["notif_type"]
        }
        Relationships: [
          {
            foreignKeyName: "realtime_notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtime_notifications_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "check_in_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtime_notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_service_schedules: {
        Row: {
          cadence: string
          created_at: string
          created_by: string | null
          day_of_week: number
          id: string
          is_active: boolean
          last_generated_at: string | null
          member_id: string
          next_run_date: string
          notes: string | null
          org_id: string | null
          service_type: string
          time_of_day: string | null
        }
        Insert: {
          cadence?: string
          created_at?: string
          created_by?: string | null
          day_of_week?: number
          id?: string
          is_active?: boolean
          last_generated_at?: string | null
          member_id: string
          next_run_date: string
          notes?: string | null
          org_id?: string | null
          service_type: string
          time_of_day?: string | null
        }
        Update: {
          cadence?: string
          created_at?: string
          created_by?: string | null
          day_of_week?: number
          id?: string
          is_active?: boolean
          last_generated_at?: string | null
          member_id?: string
          next_run_date?: string
          notes?: string | null
          org_id?: string | null
          service_type?: string
          time_of_day?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_service_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_service_schedules_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_service_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_partners: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          org_name: string
          partner_type: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          org_name: string
          partner_type?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          org_name?: string
          partner_type?: string
        }
        Relationships: []
      }
      role_invitations: {
        Row: {
          aaa_id: string | null
          accepted_at: string | null
          accepted_by_auth: string | null
          agency_id: string | null
          created_at: string
          email: string
          employer_account_id: string | null
          expires_at: string
          id: string
          invited_by_auth: string | null
          invited_by_name: string | null
          network_id: string | null
          note: string | null
          org_id: string | null
          role: string
          senior_center_id: string | null
          status: string
          token: string
          university_name: string | null
        }
        Insert: {
          aaa_id?: string | null
          accepted_at?: string | null
          accepted_by_auth?: string | null
          agency_id?: string | null
          created_at?: string
          email: string
          employer_account_id?: string | null
          expires_at?: string
          id?: string
          invited_by_auth?: string | null
          invited_by_name?: string | null
          network_id?: string | null
          note?: string | null
          org_id?: string | null
          role: string
          senior_center_id?: string | null
          status?: string
          token: string
          university_name?: string | null
        }
        Update: {
          aaa_id?: string | null
          accepted_at?: string | null
          accepted_by_auth?: string | null
          agency_id?: string | null
          created_at?: string
          email?: string
          employer_account_id?: string | null
          expires_at?: string
          id?: string
          invited_by_auth?: string | null
          invited_by_name?: string | null
          network_id?: string | null
          note?: string | null
          org_id?: string | null
          role?: string
          senior_center_id?: string | null
          status?: string
          token?: string
          university_name?: string | null
        }
        Relationships: []
      }
      room_bookings: {
        Row: {
          booked_by: string | null
          booking_title: string
          center_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          room: string
          start_time: string
          status: string
        }
        Insert: {
          booked_by?: string | null
          booking_title: string
          center_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          room: string
          start_time: string
          status?: string
        }
        Update: {
          booked_by?: string | null
          booking_title?: string
          center_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          room?: string
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_bookings_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "senior_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      senior_centers: {
        Row: {
          address: string
          capacity: number
          center_name: string
          city: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          operating_hours: string
          phone: string | null
          state: string
          zip: string | null
        }
        Insert: {
          address: string
          capacity?: number
          center_name: string
          city: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          operating_hours?: string
          phone?: string | null
          state: string
          zip?: string | null
        }
        Update: {
          address?: string
          capacity?: number
          center_name?: string
          city?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          operating_hours?: string
          phone?: string | null
          state?: string
          zip?: string | null
        }
        Relationships: []
      }
      service_bookings: {
        Row: {
          booking_details: Json
          completed_at: string | null
          confirmed_at: string | null
          cost_estimate: number | null
          created_at: string
          id: string
          member_id: string
          notes: string | null
          provider_booking_id: string | null
          provider_name: string | null
          requested_for: string | null
          service_type: string
          status: Database["public"]["Enums"]["booking_status"]
          volunteer_id: string | null
        }
        Insert: {
          booking_details?: Json
          completed_at?: string | null
          confirmed_at?: string | null
          cost_estimate?: number | null
          created_at?: string
          id?: string
          member_id: string
          notes?: string | null
          provider_booking_id?: string | null
          provider_name?: string | null
          requested_for?: string | null
          service_type: string
          status?: Database["public"]["Enums"]["booking_status"]
          volunteer_id?: string | null
        }
        Update: {
          booking_details?: Json
          completed_at?: string | null
          confirmed_at?: string | null
          cost_estimate?: number | null
          created_at?: string
          id?: string
          member_id?: string
          notes?: string | null
          provider_booking_id?: string | null
          provider_name?: string | null
          requested_for?: string | null
          service_type?: string
          status?: Database["public"]["Enums"]["booking_status"]
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          city: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          rating_average: number | null
          service_types: string[] | null
          state: string | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          rating_average?: number | null
          service_types?: string[] | null
          state?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          rating_average?: number | null
          service_types?: string[] | null
          state?: string | null
        }
        Relationships: []
      }
      skill_exchanges: {
        Row: {
          created_at: string
          credits_transferred: number | null
          duration_hours: number
          id: string
          learner_member_id: string
          learner_rating: number | null
          scheduled_date: string | null
          skill_id: string
          status: string
          teacher_member_id: string
          teacher_rating: number | null
        }
        Insert: {
          created_at?: string
          credits_transferred?: number | null
          duration_hours?: number
          id?: string
          learner_member_id: string
          learner_rating?: number | null
          scheduled_date?: string | null
          skill_id: string
          status?: string
          teacher_member_id: string
          teacher_rating?: number | null
        }
        Update: {
          created_at?: string
          credits_transferred?: number | null
          duration_hours?: number
          id?: string
          learner_member_id?: string
          learner_rating?: number | null
          scheduled_date?: string | null
          skill_id?: string
          status?: string
          teacher_member_id?: string
          teacher_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_exchanges_learner_member_id_fkey"
            columns: ["learner_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_exchanges_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills_offered"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_exchanges_teacher_member_id_fkey"
            columns: ["teacher_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      skills_offered: {
        Row: {
          created_at: string
          delivery_method: string
          description: string
          id: string
          is_active: boolean
          max_group_size: number
          member_id: string
          skill_category: string
          skill_name: string
        }
        Insert: {
          created_at?: string
          delivery_method?: string
          description: string
          id?: string
          is_active?: boolean
          max_group_size?: number
          member_id: string
          skill_category?: string
          skill_name: string
        }
        Update: {
          created_at?: string
          delivery_method?: string
          description?: string
          id?: string
          is_active?: boolean
          max_group_size?: number
          member_id?: string
          skill_category?: string
          skill_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_offered_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      soap_notes: {
        Row: {
          agency_id: string
          assessment: string
          billing_codes: string[] | null
          care_worker_id: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          locked_at: string | null
          member_id: string
          note_date: string
          objective: string
          plan: string
          signed_at: string | null
          signed_by_name: string | null
          status: Database["public"]["Enums"]["soap_note_status"]
          subjective: string
          updated_at: string
          visit_id: string | null
          visit_type: string | null
        }
        Insert: {
          agency_id: string
          assessment?: string
          billing_codes?: string[] | null
          care_worker_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          locked_at?: string | null
          member_id: string
          note_date?: string
          objective?: string
          plan?: string
          signed_at?: string | null
          signed_by_name?: string | null
          status?: Database["public"]["Enums"]["soap_note_status"]
          subjective?: string
          updated_at?: string
          visit_id?: string | null
          visit_type?: string | null
        }
        Update: {
          agency_id?: string
          assessment?: string
          billing_codes?: string[] | null
          care_worker_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          locked_at?: string | null
          member_id?: string
          note_date?: string
          objective?: string
          plan?: string
          signed_at?: string | null
          signed_by_name?: string | null
          status?: Database["public"]["Enums"]["soap_note_status"]
          subjective?: string
          updated_at?: string
          visit_id?: string | null
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soap_notes_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "care_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soap_notes_care_worker_id_fkey"
            columns: ["care_worker_id"]
            isOneToOne: false
            referencedRelation: "care_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soap_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soap_notes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "care_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      student_visits: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          reflection: string
          student_id: string
          verified: boolean
          visit_date: string
          visit_type: string
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          id?: string
          notes?: string | null
          reflection: string
          student_id: string
          verified?: boolean
          visit_date: string
          visit_type?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          reflection?: string
          student_id?: string
          verified?: boolean
          visit_date?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_visits_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      student_volunteers: {
        Row: {
          created_at: string
          email: string
          full_name: string
          graduation_year: number | null
          id: string
          interests: string[] | null
          languages: string[] | null
          major: string | null
          status: string
          supabase_auth_id: string | null
          total_hours_logged: number | null
          university_name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          graduation_year?: number | null
          id?: string
          interests?: string[] | null
          languages?: string[] | null
          major?: string | null
          status?: string
          supabase_auth_id?: string | null
          total_hours_logged?: number | null
          university_name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          graduation_year?: number | null
          id?: string
          interests?: string[] | null
          languages?: string[] | null
          major?: string | null
          status?: string
          supabase_auth_id?: string | null
          total_hours_logged?: number | null
          university_name?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          member_id: string
          monthly_amount_cents: number | null
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          member_id: string
          monthly_amount_cents?: number | null
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          member_id?: string
          monthly_amount_cents?: number | null
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      time_credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          exchange_id: string | null
          id: string
          member_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          exchange_id?: string | null
          id?: string
          member_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          exchange_id?: string | null
          id?: string
          member_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_credit_transactions_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "skill_exchanges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_credit_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      time_credits: {
        Row: {
          balance: number
          id: string
          lifetime_earned: number
          lifetime_spent: number
          member_id: string
        }
        Insert: {
          balance?: number
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          member_id: string
        }
        Update: {
          balance?: number
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_credits_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      tracked_items: {
        Row: {
          attachments: string[] | null
          call_reminder: boolean
          category: string
          created_at: string
          created_by: string | null
          expiration_or_appointment_date: string
          id: string
          is_recurring: boolean
          item_name: string
          item_type: string
          last_reminded_at: string | null
          member_id: string
          notes: string | null
          preferred_contact_method: string | null
          recurrence_cycle_days: number | null
          reminder_lead_days: number
          renewal_contact_info: string | null
          snoozed_until: string | null
          status: string
          subcategory: string | null
        }
        Insert: {
          attachments?: string[] | null
          call_reminder?: boolean
          category?: string
          created_at?: string
          created_by?: string | null
          expiration_or_appointment_date: string
          id?: string
          is_recurring?: boolean
          item_name: string
          item_type?: string
          last_reminded_at?: string | null
          member_id: string
          notes?: string | null
          preferred_contact_method?: string | null
          recurrence_cycle_days?: number | null
          reminder_lead_days?: number
          renewal_contact_info?: string | null
          snoozed_until?: string | null
          status?: string
          subcategory?: string | null
        }
        Update: {
          attachments?: string[] | null
          call_reminder?: boolean
          category?: string
          created_at?: string
          created_by?: string | null
          expiration_or_appointment_date?: string
          id?: string
          is_recurring?: boolean
          item_name?: string
          item_type?: string
          last_reminded_at?: string | null
          member_id?: string
          notes?: string | null
          preferred_contact_method?: string | null
          recurrence_cycle_days?: number | null
          reminder_lead_days?: number
          renewal_contact_info?: string | null
          snoozed_until?: string | null
          status?: string
          subcategory?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracked_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracked_items_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_advisors: {
        Row: {
          accepts_new_clients: boolean
          advisor_type: Database["public"]["Enums"]["advisor_type"]
          avg_rating: number | null
          bio: string | null
          city: string | null
          created_at: string
          credentials: string[]
          email: string | null
          firm_name: string | null
          full_name: string
          headshot_path: string | null
          id: string
          languages: string[]
          listing_expires_at: string | null
          listing_fee_annual: number
          listing_started_at: string | null
          listing_status: Database["public"]["Enums"]["advisor_listing_status"]
          listing_tier: Database["public"]["Enums"]["advisor_listing_tier"]
          notes: string | null
          offers_free_consult: boolean
          phone: string | null
          service_metros: string[]
          service_states: string[]
          sliding_scale: boolean
          state: string | null
          thrive_verified: boolean
          total_reviews: number
          vetted_at: string | null
          vetted_by: string | null
          website: string | null
        }
        Insert: {
          accepts_new_clients?: boolean
          advisor_type: Database["public"]["Enums"]["advisor_type"]
          avg_rating?: number | null
          bio?: string | null
          city?: string | null
          created_at?: string
          credentials?: string[]
          email?: string | null
          firm_name?: string | null
          full_name: string
          headshot_path?: string | null
          id?: string
          languages?: string[]
          listing_expires_at?: string | null
          listing_fee_annual?: number
          listing_started_at?: string | null
          listing_status?: Database["public"]["Enums"]["advisor_listing_status"]
          listing_tier?: Database["public"]["Enums"]["advisor_listing_tier"]
          notes?: string | null
          offers_free_consult?: boolean
          phone?: string | null
          service_metros?: string[]
          service_states?: string[]
          sliding_scale?: boolean
          state?: string | null
          thrive_verified?: boolean
          total_reviews?: number
          vetted_at?: string | null
          vetted_by?: string | null
          website?: string | null
        }
        Update: {
          accepts_new_clients?: boolean
          advisor_type?: Database["public"]["Enums"]["advisor_type"]
          avg_rating?: number | null
          bio?: string | null
          city?: string | null
          created_at?: string
          credentials?: string[]
          email?: string | null
          firm_name?: string | null
          full_name?: string
          headshot_path?: string | null
          id?: string
          languages?: string[]
          listing_expires_at?: string | null
          listing_fee_annual?: number
          listing_started_at?: string | null
          listing_status?: Database["public"]["Enums"]["advisor_listing_status"]
          listing_tier?: Database["public"]["Enums"]["advisor_listing_tier"]
          notes?: string | null
          offers_free_consult?: boolean
          phone?: string | null
          service_metros?: string[]
          service_states?: string[]
          sliding_scale?: boolean
          state?: string | null
          thrive_verified?: boolean
          total_reviews?: number
          vetted_at?: string | null
          vetted_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trusted_advisors_vetted_by_fkey"
            columns: ["vetted_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vita_appointments: {
        Row: {
          created_at: string
          estimated_income_band: string | null
          filing_situation: string | null
          id: string
          member_id: string
          navigator_id: string | null
          navigator_note: string | null
          navigator_task_id: string | null
          needs_language_support: string | null
          needs_transport: boolean
          preferred_dates: string | null
          requested_by: string | null
          scheduled_for: string | null
          status: string
          tax_year: number
          vita_site_id: string | null
        }
        Insert: {
          created_at?: string
          estimated_income_band?: string | null
          filing_situation?: string | null
          id?: string
          member_id: string
          navigator_id?: string | null
          navigator_note?: string | null
          navigator_task_id?: string | null
          needs_language_support?: string | null
          needs_transport?: boolean
          preferred_dates?: string | null
          requested_by?: string | null
          scheduled_for?: string | null
          status?: string
          tax_year: number
          vita_site_id?: string | null
        }
        Update: {
          created_at?: string
          estimated_income_band?: string | null
          filing_situation?: string | null
          id?: string
          member_id?: string
          navigator_id?: string | null
          navigator_note?: string | null
          navigator_task_id?: string | null
          needs_language_support?: string | null
          needs_transport?: boolean
          preferred_dates?: string | null
          requested_by?: string | null
          scheduled_for?: string | null
          status?: string
          tax_year?: number
          vita_site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vita_appointments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vita_appointments_navigator_id_fkey"
            columns: ["navigator_id"]
            isOneToOne: false
            referencedRelation: "care_navigators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vita_appointments_navigator_task_id_fkey"
            columns: ["navigator_task_id"]
            isOneToOne: false
            referencedRelation: "navigator_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vita_appointments_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vita_appointments_vita_site_id_fkey"
            columns: ["vita_site_id"]
            isOneToOne: false
            referencedRelation: "vita_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      vita_sites: {
        Row: {
          address: string | null
          appointment_required: boolean
          city: string | null
          created_at: string
          drop_off_available: boolean
          external_id: string | null
          host_org: string | null
          hours_note: string | null
          id: string
          is_active: boolean
          languages: string[]
          phone: string | null
          program_type: string
          season_end: string | null
          season_start: string | null
          site_name: string
          source: string
          state: string | null
          virtual_available: boolean
          zip: string | null
        }
        Insert: {
          address?: string | null
          appointment_required?: boolean
          city?: string | null
          created_at?: string
          drop_off_available?: boolean
          external_id?: string | null
          host_org?: string | null
          hours_note?: string | null
          id?: string
          is_active?: boolean
          languages?: string[]
          phone?: string | null
          program_type?: string
          season_end?: string | null
          season_start?: string | null
          site_name: string
          source?: string
          state?: string | null
          virtual_available?: boolean
          zip?: string | null
        }
        Update: {
          address?: string | null
          appointment_required?: boolean
          city?: string | null
          created_at?: string
          drop_off_available?: boolean
          external_id?: string | null
          host_org?: string | null
          hours_note?: string | null
          id?: string
          is_active?: boolean
          languages?: string[]
          phone?: string | null
          program_type?: string
          season_end?: string | null
          season_start?: string | null
          site_name?: string
          source?: string
          state?: string | null
          virtual_available?: boolean
          zip?: string | null
        }
        Relationships: []
      }
      volunteer_matches: {
        Row: {
          created_at: string
          id: string
          intro_sent_at: string | null
          match_reasons: Json
          match_score: number
          matched_at: string | null
          member_id: string
          status: string
          volunteer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intro_sent_at?: string | null
          match_reasons?: Json
          match_score?: number
          matched_at?: string | null
          member_id: string
          status?: string
          volunteer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intro_sent_at?: string | null
          match_reasons?: Json
          match_score?: number
          matched_at?: string | null
          member_id?: string
          status?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_matches_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_matches_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_shifts: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          volunteer_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          volunteer_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_shifts_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_visits: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          member_id: string
          member_rating: number | null
          verified: boolean
          visit_date: string
          visit_type: Database["public"]["Enums"]["visit_type"]
          volunteer_id: string
          volunteer_notes: string | null
          volunteer_rating: number | null
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          id?: string
          member_id: string
          member_rating?: number | null
          verified?: boolean
          visit_date: string
          visit_type: Database["public"]["Enums"]["visit_type"]
          volunteer_id: string
          volunteer_notes?: string | null
          volunteer_rating?: number | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          member_id?: string
          member_rating?: number | null
          verified?: boolean
          visit_date?: string
          visit_type?: Database["public"]["Enums"]["visit_type"]
          volunteer_id?: string
          volunteer_notes?: string | null
          volunteer_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_visits_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_visits_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteers: {
        Row: {
          availability_days: string[] | null
          background_check_id: string | null
          background_check_status: string | null
          buddy_active_count: number
          buddy_bio: string | null
          buddy_capacity: number
          buddy_preferences: Json | null
          city: string | null
          corporate_program_id: string | null
          created_at: string
          email: string
          faith_affiliation: string | null
          full_name: string
          has_drivers_license: boolean
          hours_per_week: string | null
          id: string
          insurance_expiry: string | null
          insurance_provider: string | null
          interests: string[] | null
          is_chaplain: boolean
          is_family_reciprocal: boolean
          is_neighbor_volunteer: boolean
          languages: string[] | null
          license_state: string | null
          notes: string | null
          phone: string | null
          prior_experience: string | null
          professional_background: string | null
          rating_average: number | null
          service_types: Database["public"]["Enums"]["visit_type"][] | null
          state: string | null
          status: Database["public"]["Enums"]["volunteer_status"]
          supabase_auth_id: string | null
          total_hours_logged: number | null
          total_seniors_helped: number | null
          volunteer_specialty: string | null
          why_volunteer: string | null
          zip_code: string | null
        }
        Insert: {
          availability_days?: string[] | null
          background_check_id?: string | null
          background_check_status?: string | null
          buddy_active_count?: number
          buddy_bio?: string | null
          buddy_capacity?: number
          buddy_preferences?: Json | null
          city?: string | null
          corporate_program_id?: string | null
          created_at?: string
          email: string
          faith_affiliation?: string | null
          full_name: string
          has_drivers_license?: boolean
          hours_per_week?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_provider?: string | null
          interests?: string[] | null
          is_chaplain?: boolean
          is_family_reciprocal?: boolean
          is_neighbor_volunteer?: boolean
          languages?: string[] | null
          license_state?: string | null
          notes?: string | null
          phone?: string | null
          prior_experience?: string | null
          professional_background?: string | null
          rating_average?: number | null
          service_types?: Database["public"]["Enums"]["visit_type"][] | null
          state?: string | null
          status?: Database["public"]["Enums"]["volunteer_status"]
          supabase_auth_id?: string | null
          total_hours_logged?: number | null
          total_seniors_helped?: number | null
          volunteer_specialty?: string | null
          why_volunteer?: string | null
          zip_code?: string | null
        }
        Update: {
          availability_days?: string[] | null
          background_check_id?: string | null
          background_check_status?: string | null
          buddy_active_count?: number
          buddy_bio?: string | null
          buddy_capacity?: number
          buddy_preferences?: Json | null
          city?: string | null
          corporate_program_id?: string | null
          created_at?: string
          email?: string
          faith_affiliation?: string | null
          full_name?: string
          has_drivers_license?: boolean
          hours_per_week?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_provider?: string | null
          interests?: string[] | null
          is_chaplain?: boolean
          is_family_reciprocal?: boolean
          is_neighbor_volunteer?: boolean
          languages?: string[] | null
          license_state?: string | null
          notes?: string | null
          phone?: string | null
          prior_experience?: string | null
          professional_background?: string | null
          rating_average?: number | null
          service_types?: Database["public"]["Enums"]["visit_type"][] | null
          state?: string | null
          status?: Database["public"]["Enums"]["volunteer_status"]
          supabase_auth_id?: string | null
          total_hours_logged?: number | null
          total_seniors_helped?: number | null
          volunteer_specialty?: string | null
          why_volunteer?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_corporate_program_id_fkey"
            columns: ["corporate_program_id"]
            isOneToOne: false
            referencedRelation: "corporate_volunteer_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_connections: {
        Row: {
          connected_at: string | null
          created_at: string
          external_user_id: string | null
          id: string
          last_sync_at: string | null
          member_id: string
          platform: string
          scopes: string[] | null
          status: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string
          external_user_id?: string | null
          id?: string
          last_sync_at?: string | null
          member_id: string
          platform: string
          scopes?: string[] | null
          status?: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string
          external_user_id?: string | null
          id?: string
          last_sync_at?: string | null
          member_id?: string
          platform?: string
          scopes?: string[] | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "wearable_connections_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_readings: {
        Row: {
          active_minutes: number | null
          connection_id: string | null
          created_at: string
          fall_detected: boolean
          id: string
          member_id: string
          reading_date: string
          resting_heart_rate: number | null
          sleep_hours: number | null
          source_platform: string | null
          steps: number | null
        }
        Insert: {
          active_minutes?: number | null
          connection_id?: string | null
          created_at?: string
          fall_detected?: boolean
          id?: string
          member_id: string
          reading_date: string
          resting_heart_rate?: number | null
          sleep_hours?: number | null
          source_platform?: string | null
          steps?: number | null
        }
        Update: {
          active_minutes?: number | null
          connection_id?: string | null
          created_at?: string
          fall_detected?: boolean
          id?: string
          member_id?: string
          reading_date?: string
          resting_heart_rate?: number | null
          sleep_hours?: number | null
          source_platform?: string | null
          steps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wearable_readings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "wearable_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wearable_readings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_baselines: {
        Row: {
          call_engagement_rate: number | null
          computed_at: string
          created_at: string
          data_points: number
          energy_mean: number | null
          energy_std: number | null
          id: string
          member_id: string
          mood_mean: number | null
          mood_std: number | null
          pain_mean: number | null
          pain_std: number | null
          resting_hr_mean: number | null
          resting_hr_std: number | null
          sleep_hours_mean: number | null
          sleep_hours_std: number | null
          status: string
          steps_mean: number | null
          steps_std: number | null
          window_days: number
        }
        Insert: {
          call_engagement_rate?: number | null
          computed_at?: string
          created_at?: string
          data_points?: number
          energy_mean?: number | null
          energy_std?: number | null
          id?: string
          member_id: string
          mood_mean?: number | null
          mood_std?: number | null
          pain_mean?: number | null
          pain_std?: number | null
          resting_hr_mean?: number | null
          resting_hr_std?: number | null
          sleep_hours_mean?: number | null
          sleep_hours_std?: number | null
          status?: string
          steps_mean?: number | null
          steps_std?: number | null
          window_days?: number
        }
        Update: {
          call_engagement_rate?: number | null
          computed_at?: string
          created_at?: string
          data_points?: number
          energy_mean?: number | null
          energy_std?: number | null
          id?: string
          member_id?: string
          mood_mean?: number | null
          mood_std?: number | null
          pain_mean?: number | null
          pain_std?: number | null
          resting_hr_mean?: number | null
          resting_hr_std?: number | null
          sleep_hours_mean?: number | null
          sleep_hours_std?: number | null
          status?: string
          steps_mean?: number | null
          steps_std?: number | null
          window_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "wellness_baselines_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acting_member_ids: { Args: never; Returns: string[] }
      get_member_ids_for_auth_user: { Args: never; Returns: string[] }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      addon_billing: "monthly" | "one_time"
      addon_purchase_status:
        | "active"
        | "pending"
        | "fulfilled"
        | "cancelled"
        | "expired"
      advisor_listing_status: "pending" | "active" | "expired" | "suspended"
      advisor_listing_tier: "standard" | "featured" | "premier"
      advisor_type:
        | "elder_law_attorney"
        | "estate_planning_attorney"
        | "financial_advisor"
        | "benefits_counselor"
        | "tax_professional"
        | "insurance_specialist"
        | "geriatric_care_manager"
      agency_type:
        | "home_health"
        | "companion"
        | "skilled_nursing"
        | "staffing"
        | "hospice"
        | "other"
      agency_visit_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "missed"
      agency_visit_type:
        | "personal_care"
        | "companionship"
        | "skilled_nursing"
        | "therapy"
        | "medication_management"
        | "homemaking"
        | "transportation"
        | "other"
      alert_severity: "informational" | "concern" | "urgent" | "emergency"
      alert_type:
        | "missed_call"
        | "mood_drop"
        | "medication_miss"
        | "wellness_drift"
        | "fall"
        | "crisis"
        | "emergency"
      booking_status:
        | "requested"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      call_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "missed"
        | "failed"
      call_type:
        | "check_in"
        | "concierge"
        | "navigator"
        | "onboarding"
        | "callback"
        | "celebration"
        | "reminder"
        | "crisis"
        | "care_line"
      care_worker_role:
        | "caregiver"
        | "nurse"
        | "therapist"
        | "care_coordinator"
        | "social_worker"
        | "other"
      check_in_frequency: "daily" | "every_other_day" | "weekly"
      event_format: "phone_only" | "video_or_phone" | "in_person"
      event_status: "upcoming" | "live" | "completed" | "cancelled"
      member_need_status: "open" | "claimed" | "fulfilled" | "cancelled"
      member_status: "active" | "inactive" | "paused"
      notif_channel: "realtime" | "sms" | "email"
      notif_severity: "info" | "concern" | "urgent" | "emergency"
      notif_status: "sent" | "failed" | "stub"
      notif_type:
        | "new_alert"
        | "call_completed"
        | "call_summary_ready"
        | "medication_reminder"
        | "system_message"
        | "service_booking_update"
        | "grief_support_assigned"
        | "family_nudge"
        | "celebration_upcoming"
        | "volunteer_matched"
        | "important_date_reminder"
        | "automation_isolation"
        | "automation_vaccination"
        | "automation_volunteer_reengagement"
        | "automation_event_noshow"
        | "automation_onboarding"
        | "automation_transport_followup"
        | "automation_tech_help_check"
        | "automation_meal_feedback"
      org_membership_tier:
        | "sliding_scale_low"
        | "sliding_scale_mid"
        | "standard"
        | "supporting"
        | "organizational"
      org_type:
        | "village_network"
        | "senior_center"
        | "nonprofit"
        | "area_agency_on_aging"
        | "faith_community"
        | "other"
      plan_tier: "basics" | "connect" | "complete" | "premier"
      referral_status: "pending" | "accepted" | "declined" | "completed"
      soap_note_status: "draft" | "signed" | "locked"
      task_priority: "low" | "medium" | "high" | "critical"
      user_role:
        | "family"
        | "navigator"
        | "admin"
        | "volunteer"
        | "student"
        | "university_admin"
        | "employer_admin"
        | "agency_admin"
        | "care_worker"
        | "org_admin"
        | "aaa_admin"
        | "senior_center_admin"
        | "network_admin"
        | "member"
      visit_type:
        | "phone_call"
        | "in_person_visit"
        | "virtual_event"
        | "grocery_help"
        | "walking_companion"
        | "reading_aloud"
        | "tech_help"
        | "travel_companion"
        | "travel_coordination"
      volunteer_status:
        | "pending"
        | "background_check"
        | "active"
        | "inactive"
        | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      addon_billing: ["monthly", "one_time"],
      addon_purchase_status: [
        "active",
        "pending",
        "fulfilled",
        "cancelled",
        "expired",
      ],
      advisor_listing_status: ["pending", "active", "expired", "suspended"],
      advisor_listing_tier: ["standard", "featured", "premier"],
      advisor_type: [
        "elder_law_attorney",
        "estate_planning_attorney",
        "financial_advisor",
        "benefits_counselor",
        "tax_professional",
        "insurance_specialist",
        "geriatric_care_manager",
      ],
      agency_type: [
        "home_health",
        "companion",
        "skilled_nursing",
        "staffing",
        "hospice",
        "other",
      ],
      agency_visit_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "missed",
      ],
      agency_visit_type: [
        "personal_care",
        "companionship",
        "skilled_nursing",
        "therapy",
        "medication_management",
        "homemaking",
        "transportation",
        "other",
      ],
      alert_severity: ["informational", "concern", "urgent", "emergency"],
      alert_type: [
        "missed_call",
        "mood_drop",
        "medication_miss",
        "wellness_drift",
        "fall",
        "crisis",
        "emergency",
      ],
      booking_status: [
        "requested",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      call_status: [
        "scheduled",
        "in_progress",
        "completed",
        "missed",
        "failed",
      ],
      call_type: [
        "check_in",
        "concierge",
        "navigator",
        "onboarding",
        "callback",
        "celebration",
        "reminder",
        "crisis",
        "care_line",
      ],
      care_worker_role: [
        "caregiver",
        "nurse",
        "therapist",
        "care_coordinator",
        "social_worker",
        "other",
      ],
      check_in_frequency: ["daily", "every_other_day", "weekly"],
      event_format: ["phone_only", "video_or_phone", "in_person"],
      event_status: ["upcoming", "live", "completed", "cancelled"],
      member_need_status: ["open", "claimed", "fulfilled", "cancelled"],
      member_status: ["active", "inactive", "paused"],
      notif_channel: ["realtime", "sms", "email"],
      notif_severity: ["info", "concern", "urgent", "emergency"],
      notif_status: ["sent", "failed", "stub"],
      notif_type: [
        "new_alert",
        "call_completed",
        "call_summary_ready",
        "medication_reminder",
        "system_message",
        "service_booking_update",
        "grief_support_assigned",
        "family_nudge",
        "celebration_upcoming",
        "volunteer_matched",
        "important_date_reminder",
        "automation_isolation",
        "automation_vaccination",
        "automation_volunteer_reengagement",
        "automation_event_noshow",
        "automation_onboarding",
        "automation_transport_followup",
        "automation_tech_help_check",
        "automation_meal_feedback",
      ],
      org_membership_tier: [
        "sliding_scale_low",
        "sliding_scale_mid",
        "standard",
        "supporting",
        "organizational",
      ],
      org_type: [
        "village_network",
        "senior_center",
        "nonprofit",
        "area_agency_on_aging",
        "faith_community",
        "other",
      ],
      plan_tier: ["basics", "connect", "complete", "premier"],
      referral_status: ["pending", "accepted", "declined", "completed"],
      soap_note_status: ["draft", "signed", "locked"],
      task_priority: ["low", "medium", "high", "critical"],
      user_role: [
        "family",
        "navigator",
        "admin",
        "volunteer",
        "student",
        "university_admin",
        "employer_admin",
        "agency_admin",
        "care_worker",
        "org_admin",
        "aaa_admin",
        "senior_center_admin",
        "network_admin",
        "member",
      ],
      visit_type: [
        "phone_call",
        "in_person_visit",
        "virtual_event",
        "grocery_help",
        "walking_companion",
        "reading_aloud",
        "tech_help",
        "travel_companion",
        "travel_coordination",
      ],
      volunteer_status: [
        "pending",
        "background_check",
        "active",
        "inactive",
        "suspended",
      ],
    },
  },
} as const
