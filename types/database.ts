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
      addon_skus: {
        Row: {
          billing_interval: string
          category: string
          created_at: string
          description: string | null
          entitlement_key: string | null
          id: string
          is_active: boolean
          name: string
          price_cents: number
          requires_plan_slug: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          billing_interval?: string
          category?: string
          created_at?: string
          description?: string | null
          entitlement_key?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_cents?: number
          requires_plan_slug?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          billing_interval?: string
          category?: string
          created_at?: string
          description?: string | null
          entitlement_key?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          requires_plan_slug?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
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
      b2b_inquiries: {
        Row: {
          contact_name: string
          created_at: string
          email: string
          id: string
          members: string | null
          message: string | null
          notes: string | null
          org_name: string
          org_type: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          email: string
          id?: string
          members?: string | null
          message?: string | null
          notes?: string | null
          org_name: string
          org_type: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          members?: string | null
          message?: string | null
          notes?: string | null
          org_name?: string
          org_type?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      b2b_platform_config: {
        Row: {
          aria_persona: string
          branding_name: string | null
          created_at: string
          features: Json
          id: string
          logo_url: string | null
          org_id: string
          primary_color: string | null
          updated_at: string
          welcome_msg: string | null
        }
        Insert: {
          aria_persona?: string
          branding_name?: string | null
          created_at?: string
          features?: Json
          id?: string
          logo_url?: string | null
          org_id: string
          primary_color?: string | null
          updated_at?: string
          welcome_msg?: string | null
        }
        Update: {
          aria_persona?: string
          branding_name?: string | null
          created_at?: string
          features?: Json
          id?: string
          logo_url?: string | null
          org_id?: string
          primary_color?: string | null
          updated_at?: string
          welcome_msg?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_platform_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      billing_entities: {
        Row: {
          amount_cents: number | null
          billing_cycle: string | null
          canceled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          entity_type: string
          id: string
          member_id: string | null
          metadata: Json
          org_id: string | null
          plan: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          amount_cents?: number | null
          billing_cycle?: string | null
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          entity_type: string
          id?: string
          member_id?: string | null
          metadata?: Json
          org_id?: string | null
          plan?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number | null
          billing_cycle?: string | null
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          entity_type?: string
          id?: string
          member_id?: string | null
          metadata?: Json
          org_id?: string | null
          plan?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_entities_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_entities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      birthday_arc_log: {
        Row: {
          created_at: string
          id: string
          member_id: string
          sent_at: string | null
          step: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          sent_at?: string | null
          step: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          sent_at?: string | null
          step?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "birthday_arc_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      birthday_arc_state: {
        Row: {
          arc_year: number
          created_at: string
          fired_at: string | null
          id: string
          member_id: string
          skip_reason: string | null
          status: string
          step: string
          updated_at: string
        }
        Insert: {
          arc_year: number
          created_at?: string
          fired_at?: string | null
          id?: string
          member_id: string
          skip_reason?: string | null
          status?: string
          step: string
          updated_at?: string
        }
        Update: {
          arc_year?: number
          created_at?: string
          fired_at?: string | null
          id?: string
          member_id?: string
          skip_reason?: string | null
          status?: string
          step?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "birthday_arc_state_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      birthday_call_arc: {
        Row: {
          arc_year: number
          birth_year: number
          created_at: string
          d_minus_7: string | null
          d_plus_1: string | null
          d_zero: string | null
          id: string
          member_id: string
          skip_reason: string | null
          skipped: boolean
          wishes_count: number
        }
        Insert: {
          arc_year: number
          birth_year: number
          created_at?: string
          d_minus_7?: string | null
          d_plus_1?: string | null
          d_zero?: string | null
          id?: string
          member_id: string
          skip_reason?: string | null
          skipped?: boolean
          wishes_count?: number
        }
        Update: {
          arc_year?: number
          birth_year?: number
          created_at?: string
          d_minus_7?: string | null
          d_plus_1?: string | null
          d_zero?: string | null
          id?: string
          member_id?: string
          skip_reason?: string | null
          skipped?: boolean
          wishes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "birthday_call_arc_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      birthday_messages: {
        Row: {
          birthday_year: number
          created_at: string
          delivery_method: string
          id: string
          member_id: string
          message: string
          sent_at: string
          sent_by: string | null
        }
        Insert: {
          birthday_year: number
          created_at?: string
          delivery_method?: string
          id?: string
          member_id: string
          message: string
          sent_at?: string
          sent_by?: string | null
        }
        Update: {
          birthday_year?: number
          created_at?: string
          delivery_method?: string
          id?: string
          member_id?: string
          message?: string
          sent_at?: string
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "birthday_messages_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthday_messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      birthday_wishes: {
        Row: {
          author_id: string | null
          author_name: string
          created_at: string
          id: string
          is_approved: boolean
          member_id: string
          message: string
          year: number
        }
        Insert: {
          author_id?: string | null
          author_name: string
          created_at?: string
          id?: string
          is_approved?: boolean
          member_id: string
          message: string
          year: number
        }
        Update: {
          author_id?: string | null
          author_name?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          member_id?: string
          message?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "birthday_wishes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthday_wishes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
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
      buddy_checkins: {
        Row: {
          buddy_match_id: string
          channel: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          logged_by: string | null
          mood_rating: number | null
          notes: string | null
          occurred_at: string
        }
        Insert: {
          buddy_match_id: string
          channel?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          logged_by?: string | null
          mood_rating?: number | null
          notes?: string | null
          occurred_at?: string
        }
        Update: {
          buddy_match_id?: string
          channel?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          logged_by?: string | null
          mood_rating?: number | null
          notes?: string | null
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buddy_checkins_buddy_match_id_fkey"
            columns: ["buddy_match_id"]
            isOneToOne: false
            referencedRelation: "buddy_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      buddy_matches: {
        Row: {
          created_at: string
          end_reason: string | null
          ended_at: string | null
          id: string
          match_score: number | null
          matched_at: string
          member_id: string
          member_rating: number | null
          status: string
          volunteer_id: string
          volunteer_rating: number | null
        }
        Insert: {
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          match_score?: number | null
          matched_at?: string
          member_id: string
          member_rating?: number | null
          status?: string
          volunteer_id: string
          volunteer_rating?: number | null
        }
        Update: {
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          match_score?: number | null
          matched_at?: string
          member_id?: string
          member_rating?: number | null
          status?: string
          volunteer_id?: string
          volunteer_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buddy_matches_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_matches_volunteer_id_fkey"
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
      campaign_contributions: {
        Row: {
          amount_cents: number | null
          anonymous: boolean
          campaign_id: string
          contribution_type: string
          contributor_member_id: string | null
          created_at: string
          id: string
          in_kind_description: string | null
          message: string | null
          status: string
          stripe_payment_intent_id: string | null
          volunteer_date: string | null
        }
        Insert: {
          amount_cents?: number | null
          anonymous?: boolean
          campaign_id: string
          contribution_type: string
          contributor_member_id?: string | null
          created_at?: string
          id?: string
          in_kind_description?: string | null
          message?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          volunteer_date?: string | null
        }
        Update: {
          amount_cents?: number | null
          anonymous?: boolean
          campaign_id?: string
          contribution_type?: string
          contributor_member_id?: string | null
          created_at?: string
          id?: string
          in_kind_description?: string | null
          message?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          volunteer_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_contributions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "member_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_contributions_contributor_member_id_fkey"
            columns: ["contributor_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_donations: {
        Row: {
          amount: number
          campaign_id: string
          created_at: string
          donor_email: string | null
          donor_member_id: string | null
          donor_name: string | null
          id: string
          is_anonymous: boolean
          message: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          campaign_id: string
          created_at?: string
          donor_email?: string | null
          donor_member_id?: string | null
          donor_name?: string | null
          id?: string
          is_anonymous?: boolean
          message?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string
          created_at?: string
          donor_email?: string | null
          donor_member_id?: string | null
          donor_name?: string | null
          id?: string
          is_anonymous?: boolean
          message?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "member_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_donations_donor_member_id_fkey"
            columns: ["donor_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          campaign_type: string
          completed_at: string | null
          created_at: string
          creator_id: string | null
          description: string | null
          donor_count: number
          ends_at: string | null
          goal_cents: number
          id: string
          image_url: string | null
          is_featured: boolean
          is_public: boolean
          metadata: Json
          org_id: string | null
          raised_cents: number
          starts_at: string | null
          status: string
          story: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          campaign_type?: string
          completed_at?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          donor_count?: number
          ends_at?: string | null
          goal_cents?: number
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_public?: boolean
          metadata?: Json
          org_id?: string | null
          raised_cents?: number
          starts_at?: string | null
          status?: string
          story?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          campaign_type?: string
          completed_at?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          donor_count?: number
          ends_at?: string | null
          goal_cents?: number
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_public?: boolean
          metadata?: Json
          org_id?: string | null
          raised_cents?: number
          starts_at?: string | null
          status?: string
          story?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      career_digest_log: {
        Row: {
          id: string
          member_id: string
          opportunity_ids: string[]
          sent_at: string
          week_of: string
        }
        Insert: {
          id?: string
          member_id: string
          opportunity_ids: string[]
          sent_at?: string
          week_of: string
        }
        Update: {
          id?: string
          member_id?: string
          opportunity_ids?: string[]
          sent_at?: string
          week_of?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_digest_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      career_interests: {
        Row: {
          created_at: string
          id: string
          member_id: string
          navigator_notes: string | null
          note: string | null
          opportunity_id: string
          status: Database["public"]["Enums"]["career_interest_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          navigator_notes?: string | null
          note?: string | null
          opportunity_id: string
          status?: Database["public"]["Enums"]["career_interest_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          navigator_notes?: string | null
          note?: string | null
          opportunity_id?: string
          status?: Database["public"]["Enums"]["career_interest_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_interests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_interests_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "career_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      career_opportunities: {
        Row: {
          age_friendly_attested: boolean
          apply_email: string | null
          apply_url: string | null
          approved_at: string | null
          approved_by: string | null
          closes_on: string | null
          created_at: string
          description: string
          expires_on: string | null
          filled_at: string | null
          hours_per_week: string | null
          id: string
          industries: string[] | null
          location: string | null
          organization: string
          partner_id: string | null
          pay: string | null
          pay_range: string | null
          posted_by: string | null
          remote: boolean
          remote_ok: boolean
          skills_desired: string[] | null
          status: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at: string
          work_type: Database["public"]["Enums"]["career_work_type"] | null
        }
        Insert: {
          age_friendly_attested?: boolean
          apply_email?: string | null
          apply_url?: string | null
          approved_at?: string | null
          approved_by?: string | null
          closes_on?: string | null
          created_at?: string
          description: string
          expires_on?: string | null
          filled_at?: string | null
          hours_per_week?: string | null
          id?: string
          industries?: string[] | null
          location?: string | null
          organization: string
          partner_id?: string | null
          pay?: string | null
          pay_range?: string | null
          posted_by?: string | null
          remote?: boolean
          remote_ok?: boolean
          skills_desired?: string[] | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at?: string
          work_type?: Database["public"]["Enums"]["career_work_type"] | null
        }
        Update: {
          age_friendly_attested?: boolean
          apply_email?: string | null
          apply_url?: string | null
          approved_at?: string | null
          approved_by?: string | null
          closes_on?: string | null
          created_at?: string
          description?: string
          expires_on?: string | null
          filled_at?: string | null
          hours_per_week?: string | null
          id?: string
          industries?: string[] | null
          location?: string | null
          organization?: string
          partner_id?: string | null
          pay?: string | null
          pay_range?: string | null
          posted_by?: string | null
          remote?: boolean
          remote_ok?: boolean
          skills_desired?: string[] | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          title?: string
          updated_at?: string
          work_type?: Database["public"]["Enums"]["career_work_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "career_opportunities_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_opportunities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "community_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_opportunities_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      career_profiles: {
        Row: {
          active: boolean
          available_from: string | null
          created_at: string
          desired_pay: string | null
          digest_opted_in: boolean
          headline: string | null
          hours_per_week_max: number | null
          id: string
          in_person_ok: boolean
          industries: string[] | null
          member_id: string
          remote_ok: boolean
          skills: string[] | null
          summary: string | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          active?: boolean
          available_from?: string | null
          created_at?: string
          desired_pay?: string | null
          digest_opted_in?: boolean
          headline?: string | null
          hours_per_week_max?: number | null
          id?: string
          in_person_ok?: boolean
          industries?: string[] | null
          member_id: string
          remote_ok?: boolean
          skills?: string[] | null
          summary?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          active?: boolean
          available_from?: string | null
          created_at?: string
          desired_pay?: string | null
          digest_opted_in?: boolean
          headline?: string | null
          hours_per_week_max?: number | null
          id?: string
          in_person_ok?: boolean
          industries?: string[] | null
          member_id?: string
          remote_ok?: boolean
          skills?: string[] | null
          summary?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "career_profiles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
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
      celebration_messages: {
        Row: {
          celebration_id: string
          content: string
          created_at: string
          id: string
          is_staff_message: boolean
          sender_id: string
        }
        Insert: {
          celebration_id: string
          content: string
          created_at?: string
          id?: string
          is_staff_message?: boolean
          sender_id: string
        }
        Update: {
          celebration_id?: string
          content?: string
          created_at?: string
          id?: string
          is_staff_message?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "celebration_messages_celebration_id_fkey"
            columns: ["celebration_id"]
            isOneToOne: false
            referencedRelation: "celebration_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "celebration_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      celebration_requests: {
        Row: {
          amount_cents: number
          celebration_date: string
          completed_at: string | null
          created_at: string
          event_id: string | null
          grief_hold: boolean
          id: string
          member_id: string
          navigator_note: string | null
          requested_by: string
          special_message: string | null
          status: string
          stripe_pi_id: string | null
          tier: string
        }
        Insert: {
          amount_cents?: number
          celebration_date: string
          completed_at?: string | null
          created_at?: string
          event_id?: string | null
          grief_hold?: boolean
          id?: string
          member_id: string
          navigator_note?: string | null
          requested_by: string
          special_message?: string | null
          status?: string
          stripe_pi_id?: string | null
          tier: string
        }
        Update: {
          amount_cents?: number
          celebration_date?: string
          completed_at?: string | null
          created_at?: string
          event_id?: string | null
          grief_hold?: boolean
          id?: string
          member_id?: string
          navigator_note?: string | null
          requested_by?: string
          special_message?: string | null
          status?: string
          stripe_pi_id?: string | null
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "celebration_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "family_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "celebration_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "celebration_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "family_members"
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
          icd10_codes: string[] | null
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
          icd10_codes?: string[] | null
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
          icd10_codes?: string[] | null
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
      circle_content: {
        Row: {
          author_id: string | null
          body: string | null
          circle_id: string
          content_type: string
          created_at: string
          id: string
          pinned: boolean
          title: string
          url: string | null
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          circle_id: string
          content_type: string
          created_at?: string
          id?: string
          pinned?: boolean
          title: string
          url?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string | null
          circle_id?: string
          content_type?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "circle_content_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_content_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "cultural_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_content_items: {
        Row: {
          body: string | null
          circle_id: string
          content_type: string
          created_at: string
          id: string
          image_url: string | null
          is_pinned: boolean
          is_published: boolean
          posted_by: string | null
          published_at: string | null
          source_name: string | null
          tags: string[]
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          body?: string | null
          circle_id: string
          content_type?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          is_published?: boolean
          posted_by?: string | null
          published_at?: string | null
          source_name?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          body?: string | null
          circle_id?: string
          content_type?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          is_published?: boolean
          posted_by?: string | null
          published_at?: string | null
          source_name?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "circle_content_items_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "cultural_circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_content_items_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "family_members"
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
          latitude: number | null
          location_address: string | null
          longitude: number | null
          rsvp_count: number
          title: string
          video_link: string | null
          zip_code: string | null
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
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          rsvp_count?: number
          title: string
          video_link?: string | null
          zip_code?: string | null
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
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          rsvp_count?: number
          title?: string
          video_link?: string | null
          zip_code?: string | null
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
          joined_via: string | null
          member_id: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          id?: string
          is_ambassador?: boolean
          joined_at?: string
          joined_via?: string | null
          member_id: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          id?: string
          is_ambassador?: boolean
          joined_at?: string
          joined_via?: string | null
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
      cognitive_activities: {
        Row: {
          activity_key: string
          activity_name: string
          duration_minutes: number | null
          id: string
          logged_at: string
          max_score: number | null
          member_id: string
          notes: string | null
          score: number | null
        }
        Insert: {
          activity_key: string
          activity_name: string
          duration_minutes?: number | null
          id?: string
          logged_at?: string
          max_score?: number | null
          member_id: string
          notes?: string | null
          score?: number | null
        }
        Update: {
          activity_key?: string
          activity_name?: string
          duration_minutes?: number | null
          id?: string
          logged_at?: string
          max_score?: number | null
          member_id?: string
          notes?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_activities_member_id_fkey"
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
          enrollment_fee_cents: number
          enrollment_paid_at: string | null
          enrollment_status: string
          helpful_village_org_id: string | null
          hv_sync_enabled: boolean
          id: string
          is_active: boolean
          member_count: number
          mission_statement: string | null
          mon_ami_integration: boolean
          network_id: string | null
          org_api_key: string | null
          org_name: string
          org_size: string | null
          org_type: Database["public"]["Enums"]["org_type"]
          plan_tier: string
          service_area_description: string | null
          setup_completed_at: string | null
          slug: string | null
          state: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          website: string | null
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
          enrollment_fee_cents?: number
          enrollment_paid_at?: string | null
          enrollment_status?: string
          helpful_village_org_id?: string | null
          hv_sync_enabled?: boolean
          id?: string
          is_active?: boolean
          member_count?: number
          mission_statement?: string | null
          mon_ami_integration?: boolean
          network_id?: string | null
          org_api_key?: string | null
          org_name: string
          org_size?: string | null
          org_type?: Database["public"]["Enums"]["org_type"]
          plan_tier?: string
          service_area_description?: string | null
          setup_completed_at?: string | null
          slug?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          website?: string | null
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
          enrollment_fee_cents?: number
          enrollment_paid_at?: string | null
          enrollment_status?: string
          helpful_village_org_id?: string | null
          hv_sync_enabled?: boolean
          id?: string
          is_active?: boolean
          member_count?: number
          mission_statement?: string | null
          mon_ami_integration?: boolean
          network_id?: string | null
          org_api_key?: string | null
          org_name?: string
          org_size?: string | null
          org_type?: Database["public"]["Enums"]["org_type"]
          plan_tier?: string
          service_area_description?: string | null
          setup_completed_at?: string | null
          slug?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          website?: string | null
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
      community_partners: {
        Row: {
          active: boolean
          address: string | null
          category: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          org_type: string
          partner_since: string | null
          phone: string | null
          service_area_zips: string[] | null
          state: string | null
          status: string
          updated_at: string
          website: string | null
          website_url: string | null
          zip: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          category?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          org_type: string
          partner_since?: string | null
          phone?: string | null
          service_area_zips?: string[] | null
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          website_url?: string | null
          zip?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          category?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_type?: string
          partner_since?: string | null
          phone?: string | null
          service_area_zips?: string[] | null
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          website_url?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      community_potlucks: {
        Row: {
          created_at: string
          cultural_theme: string | null
          description: string | null
          dish_signups: Json
          event_date: string
          event_time: string | null
          id: string
          location: string | null
          max_attendees: number | null
          organizer_id: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          cultural_theme?: string | null
          description?: string | null
          dish_signups?: Json
          event_date: string
          event_time?: string | null
          id?: string
          location?: string | null
          max_attendees?: number | null
          organizer_id?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          cultural_theme?: string | null
          description?: string | null
          dish_signups?: Json
          event_date?: string
          event_time?: string | null
          id?: string
          location?: string | null
          max_attendees?: number | null
          organizer_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_potlucks_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "members"
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
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
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
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
          {
            foreignKeyName: "community_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "care_navigators"
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
      concierge_requests: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string
          id: string
          member_id: string
          navigator_notes: string | null
          preferred_date: string | null
          preferred_time: string | null
          request_type: string
          requested_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
          member_id: string
          navigator_notes?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          request_type: string
          requested_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          member_id?: string
          navigator_notes?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          request_type?: string
          requested_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concierge_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "care_navigators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
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
      corporate_accounts: {
        Row: {
          active: boolean
          active_seats: number
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          employee_seats: number
          id: string
          notes: string | null
          plan: string
          stripe_customer_id: string | null
        }
        Insert: {
          active?: boolean
          active_seats?: number
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          employee_seats?: number
          id?: string
          notes?: string | null
          plan?: string
          stripe_customer_id?: string | null
        }
        Update: {
          active?: boolean
          active_seats?: number
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          employee_seats?: number
          id?: string
          notes?: string | null
          plan?: string
          stripe_customer_id?: string | null
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
          hour_target: number
          id: string
          integration_type: string
          matching_rate_per_hour: number
          package_type: string
          program_name: string
          recognition_badge_url: string | null
          status: string
          tier: string
          total_hours_logged: number
          total_matched_value: number
        }
        Insert: {
          annual_hour_cap_per_employee?: number | null
          created_at?: string
          employer_account_id: string
          hour_target?: number
          id?: string
          integration_type?: string
          matching_rate_per_hour?: number
          package_type?: string
          program_name: string
          recognition_badge_url?: string | null
          status?: string
          tier?: string
          total_hours_logged?: number
          total_matched_value?: number
        }
        Update: {
          annual_hour_cap_per_employee?: number | null
          created_at?: string
          employer_account_id?: string
          hour_target?: number
          id?: string
          integration_type?: string
          matching_rate_per_hour?: number
          package_type?: string
          program_name?: string
          recognition_badge_url?: string | null
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
          age_max: number | null
          age_min: number | null
          auto_enroll_criteria: Json | null
          circle_name: string
          circle_type: string
          community_type: string
          created_at: string
          created_by_staff: boolean
          description: string
          emoji: string | null
          id: string
          image_placeholder: string | null
          interest_tag: string | null
          is_active: boolean
          member_count: number
          membership_visibility: string
          primary_language: string
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          auto_enroll_criteria?: Json | null
          circle_name: string
          circle_type?: string
          community_type?: string
          created_at?: string
          created_by_staff?: boolean
          description: string
          emoji?: string | null
          id?: string
          image_placeholder?: string | null
          interest_tag?: string | null
          is_active?: boolean
          member_count?: number
          membership_visibility?: string
          primary_language?: string
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          auto_enroll_criteria?: Json | null
          circle_name?: string
          circle_type?: string
          community_type?: string
          created_at?: string
          created_by_staff?: boolean
          description?: string
          emoji?: string | null
          id?: string
          image_placeholder?: string | null
          interest_tag?: string | null
          is_active?: boolean
          member_count?: number
          membership_visibility?: string
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
          aria_script_key: string | null
          circle_name: string | null
          created_at: string
          cultural_group: string | null
          culture_label: string
          day: number | null
          description: string
          end_date: string | null
          festival_date: string
          festival_name: string
          id: string
          is_active: boolean
          is_multi_day: boolean
          month: number | null
          primary_language: string
          traditions: string | null
          typical_greeting: string | null
        }
        Insert: {
          aria_script_key?: string | null
          circle_name?: string | null
          created_at?: string
          cultural_group?: string | null
          culture_label: string
          day?: number | null
          description: string
          end_date?: string | null
          festival_date: string
          festival_name: string
          id?: string
          is_active?: boolean
          is_multi_day?: boolean
          month?: number | null
          primary_language?: string
          traditions?: string | null
          typical_greeting?: string | null
        }
        Update: {
          aria_script_key?: string | null
          circle_name?: string | null
          created_at?: string
          cultural_group?: string | null
          culture_label?: string
          day?: number | null
          description?: string
          end_date?: string | null
          festival_date?: string
          festival_name?: string
          id?: string
          is_active?: boolean
          is_multi_day?: boolean
          month?: number | null
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
      emergency_magnets: {
        Row: {
          created_at: string
          delivered_at: string | null
          enrollment_id: string
          generated_pdf_path: string | null
          id: string
          printed: boolean
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          enrollment_id: string
          generated_pdf_path?: string | null
          id?: string
          printed?: boolean
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          enrollment_id?: string
          generated_pdf_path?: string | null
          id?: string
          printed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "emergency_magnets_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "safety_program_enrollments"
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
      encore_applications: {
        Row: {
          cover_note: string | null
          created_at: string
          encore_profile_id: string
          id: string
          navigator_notes: string | null
          opportunity_id: string
          status: string
          updated_at: string
        }
        Insert: {
          cover_note?: string | null
          created_at?: string
          encore_profile_id: string
          id?: string
          navigator_notes?: string | null
          opportunity_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          cover_note?: string | null
          created_at?: string
          encore_profile_id?: string
          id?: string
          navigator_notes?: string | null
          opportunity_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encore_applications_encore_profile_id_fkey"
            columns: ["encore_profile_id"]
            isOneToOne: false
            referencedRelation: "encore_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encore_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "encore_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      encore_opportunities: {
        Row: {
          apply_email: string | null
          apply_url: string | null
          city: string | null
          compensation: string | null
          created_at: string
          description: string | null
          expires_at: string | null
          hours_per_week: number | null
          id: string
          opportunity_type: string
          org_name: string
          partner_id: string | null
          posted_by: string | null
          remote: boolean | null
          skills_needed: string[] | null
          state: string | null
          status: string
          title: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          apply_email?: string | null
          apply_url?: string | null
          city?: string | null
          compensation?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          hours_per_week?: number | null
          id?: string
          opportunity_type: string
          org_name: string
          partner_id?: string | null
          posted_by?: string | null
          remote?: boolean | null
          skills_needed?: string[] | null
          state?: string | null
          status?: string
          title: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          apply_email?: string | null
          apply_url?: string | null
          city?: string | null
          compensation?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          hours_per_week?: number | null
          id?: string
          opportunity_type?: string
          org_name?: string
          partner_id?: string | null
          posted_by?: string | null
          remote?: boolean | null
          skills_needed?: string[] | null
          state?: string | null
          status?: string
          title?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encore_opportunities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "community_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encore_opportunities_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      encore_profiles: {
        Row: {
          bio: string | null
          created_at: string
          education: string | null
          goal: string | null
          hours_per_week: number | null
          id: string
          in_person_ok: boolean | null
          interests: string[] | null
          languages: string[] | null
          max_commute_miles: number | null
          member_id: string
          open_to_training: boolean | null
          previous_career: string | null
          remote_ok: boolean | null
          resume_url: string | null
          skills: string[] | null
          status: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          education?: string | null
          goal?: string | null
          hours_per_week?: number | null
          id?: string
          in_person_ok?: boolean | null
          interests?: string[] | null
          languages?: string[] | null
          max_commute_miles?: number | null
          member_id: string
          open_to_training?: boolean | null
          previous_career?: string | null
          remote_ok?: boolean | null
          resume_url?: string | null
          skills?: string[] | null
          status?: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          education?: string | null
          goal?: string | null
          hours_per_week?: number | null
          id?: string
          in_person_ok?: boolean | null
          interests?: string[] | null
          languages?: string[] | null
          max_commute_miles?: number | null
          member_id?: string
          open_to_training?: boolean | null
          previous_career?: string | null
          remote_ok?: boolean | null
          resume_url?: string | null
          skills?: string[] | null
          status?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encore_profiles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
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
      family_events: {
        Row: {
          aria_notified_1d: boolean
          aria_notified_7d: boolean
          cancelled_at: string | null
          created_at: string
          created_by: string
          event_date: string
          event_type: string
          family_notified: boolean
          id: string
          member_id: string
          notes: string | null
          recurring: boolean
          title: string
        }
        Insert: {
          aria_notified_1d?: boolean
          aria_notified_7d?: boolean
          cancelled_at?: string | null
          created_at?: string
          created_by: string
          event_date: string
          event_type: string
          family_notified?: boolean
          id?: string
          member_id: string
          notes?: string | null
          recurring?: boolean
          title: string
        }
        Update: {
          aria_notified_1d?: boolean
          aria_notified_7d?: boolean
          cancelled_at?: string | null
          created_at?: string
          created_by?: string
          event_date?: string
          event_type?: string
          family_notified?: boolean
          id?: string
          member_id?: string
          notes?: string | null
          recurring?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_events_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          member_id: string
          revoked_at: string | null
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          member_id: string
          revoked_at?: string | null
          role?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          member_id?: string
          revoked_at?: string | null
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invitations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
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
          notify_celebration: boolean
          notify_checkin_summary: boolean
          notify_crisis: boolean
          notify_missed_call: boolean
          notify_tracked_item_due: boolean
          org_id: string | null
          phone: string | null
          referring_agency_id: string | null
          relationship: string | null
          role: Database["public"]["Enums"]["user_role"]
          senior_center_id: string | null
          sms_opted_in: boolean
          sms_opted_in_at: string | null
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
          notify_celebration?: boolean
          notify_checkin_summary?: boolean
          notify_crisis?: boolean
          notify_missed_call?: boolean
          notify_tracked_item_due?: boolean
          org_id?: string | null
          phone?: string | null
          referring_agency_id?: string | null
          relationship?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          senior_center_id?: string | null
          sms_opted_in?: boolean
          sms_opted_in_at?: string | null
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
          notify_celebration?: boolean
          notify_checkin_summary?: boolean
          notify_crisis?: boolean
          notify_missed_call?: boolean
          notify_tracked_item_due?: boolean
          org_id?: string | null
          phone?: string | null
          referring_agency_id?: string | null
          relationship?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          senior_center_id?: string | null
          sms_opted_in?: boolean
          sms_opted_in_at?: string | null
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
      family_sms_preferences: {
        Row: {
          appointment_reminders: boolean
          created_at: string
          crisis_alerts: boolean
          daily_summary: boolean
          family_member_id: string
          id: string
          member_id: string
          phone: string
          summary_time_local: string
        }
        Insert: {
          appointment_reminders?: boolean
          created_at?: string
          crisis_alerts?: boolean
          daily_summary?: boolean
          family_member_id: string
          id?: string
          member_id: string
          phone: string
          summary_time_local?: string
        }
        Update: {
          appointment_reminders?: boolean
          created_at?: string
          crisis_alerts?: boolean
          daily_summary?: boolean
          family_member_id?: string
          id?: string
          member_id?: string
          phone?: string
          summary_time_local?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_sms_preferences_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_sms_preferences_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_summary_log: {
        Row: {
          body: string
          channel: string
          created_at: string
          error: string | null
          id: string
          member_id: string
          recipient: string | null
          sent_at: string
          status: string
          summary_date: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          member_id: string
          recipient?: string | null
          sent_at?: string
          status?: string
          summary_date: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          member_id?: string
          recipient?: string | null
          sent_at?: string
          status?: string
          summary_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_summary_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
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
      fhir_connections: {
        Row: {
          access_token: string | null
          created_at: string
          error_message: string | null
          fhir_server_url: string
          id: string
          last_synced_at: string | null
          member_id: string
          patient_id: string
          refresh_token: string | null
          status: string
          token_expires_at: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          error_message?: string | null
          fhir_server_url: string
          id?: string
          last_synced_at?: string | null
          member_id: string
          patient_id: string
          refresh_token?: string | null
          status?: string
          token_expires_at?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          error_message?: string | null
          fhir_server_url?: string
          id?: string
          last_synced_at?: string | null
          member_id?: string
          patient_id?: string
          refresh_token?: string | null
          status?: string
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fhir_connections_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
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
      fhir_resources: {
        Row: {
          connection_id: string
          created_at: string
          id: string
          member_id: string
          recorded_at: string | null
          resource_data: Json
          resource_id: string
          resource_type: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          id?: string
          member_id: string
          recorded_at?: string | null
          resource_data?: Json
          resource_id: string
          resource_type: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          id?: string
          member_id?: string
          recorded_at?: string | null
          resource_data?: Json
          resource_id?: string
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fhir_resources_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "fhir_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fhir_resources_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      fitness_logs: {
        Row: {
          category: string
          difficulty_felt: string | null
          duration_minutes: number | null
          exercise_key: string
          id: string
          logged_at: string
          member_id: string
          notes: string | null
          reps: number | null
          sets: number | null
        }
        Insert: {
          category: string
          difficulty_felt?: string | null
          duration_minutes?: number | null
          exercise_key: string
          id?: string
          logged_at?: string
          member_id: string
          notes?: string | null
          reps?: number | null
          sets?: number | null
        }
        Update: {
          category?: string
          difficulty_felt?: string | null
          duration_minutes?: number | null
          exercise_key?: string
          id?: string
          logged_at?: string
          member_id?: string
          notes?: string | null
          reps?: number | null
          sets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fitness_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_cases: {
        Row: {
          alert_type: string
          call_id: string | null
          case_ref: string
          created_at: string
          details: string | null
          detected_during: string | null
          family_notified: boolean
          id: string
          member_id: string
          metadata: Json | null
          navigator_notified: boolean
          recommended_action: string | null
          resolution_notes: string | null
          resolved_at: string | null
          risk_level: string
          status: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          call_id?: string | null
          case_ref?: string
          created_at?: string
          details?: string | null
          detected_during?: string | null
          family_notified?: boolean
          id?: string
          member_id: string
          metadata?: Json | null
          navigator_notified?: boolean
          recommended_action?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          risk_level?: string
          status?: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          call_id?: string | null
          case_ref?: string
          created_at?: string
          details?: string | null
          detected_during?: string | null
          family_notified?: boolean
          id?: string
          member_id?: string
          metadata?: Json | null
          navigator_notified?: boolean
          recommended_action?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          risk_level?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_cases_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_flags: {
        Row: {
          created_at: string
          family_notified_at: string | null
          id: string
          matched_text: string | null
          member_id: string
          navigator_task_id: string | null
          resolution_note: string | null
          resolved_by: string | null
          scam_type: string
          severity: string
          source: string
          source_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          family_notified_at?: string | null
          id?: string
          matched_text?: string | null
          member_id: string
          navigator_task_id?: string | null
          resolution_note?: string | null
          resolved_by?: string | null
          scam_type: string
          severity?: string
          source: string
          source_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          family_notified_at?: string | null
          id?: string
          matched_text?: string | null
          member_id?: string
          navigator_task_id?: string | null
          resolution_note?: string | null
          resolved_by?: string | null
          scam_type?: string
          severity?: string
          source?: string
          source_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_flags_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_scan_queue: {
        Row: {
          created_at: string
          id: string
          member_id: string
          payload: Json | null
          reviewed_at: string | null
          reviewer_notes: string | null
          risk_score: number | null
          source_id: string | null
          source_type: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          payload?: Json | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          risk_score?: number | null
          source_id?: string | null
          source_type: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          payload?: Json | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          risk_score?: number | null
          source_id?: string | null
          source_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_scan_queue_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_orders: {
        Row: {
          amount_cents: number | null
          created_at: string
          event_id: string | null
          gift_label: string
          gift_type: string
          id: string
          member_id: string
          message: string | null
          recipient_email: string | null
          recipient_name: string
          status: string
          stripe_pi_id: string | null
          tracking_url: string | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          event_id?: string | null
          gift_label: string
          gift_type: string
          id?: string
          member_id: string
          message?: string | null
          recipient_email?: string | null
          recipient_name: string
          status?: string
          stripe_pi_id?: string | null
          tracking_url?: string | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          event_id?: string | null
          gift_label?: string
          gift_type?: string
          id?: string
          member_id?: string
          message?: string | null
          recipient_email?: string | null
          recipient_name?: string
          status?: string
          stripe_pi_id?: string | null
          tracking_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "family_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_orders_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          amount_cents: number | null
          created_at: string
          expires_at: string | null
          gift_description: string
          gift_type: string
          id: string
          message: string | null
          occasion: string | null
          recipient_email: string | null
          recipient_member_id: string | null
          redeemed_at: string | null
          sender_user_id: string
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          expires_at?: string | null
          gift_description: string
          gift_type: string
          id?: string
          message?: string | null
          occasion?: string | null
          recipient_email?: string | null
          recipient_member_id?: string | null
          redeemed_at?: string | null
          sender_user_id: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          expires_at?: string | null
          gift_description?: string
          gift_type?: string
          id?: string
          message?: string | null
          occasion?: string | null
          recipient_email?: string | null
          recipient_member_id?: string | null
          redeemed_at?: string | null
          sender_user_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gifts_recipient_member_id_fkey"
            columns: ["recipient_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      go_bags: {
        Row: {
          contents_checklist: Json
          created_at: string
          delivered_at: string | null
          enrollment_id: string
          id: string
          next_refresh_due: string | null
        }
        Insert: {
          contents_checklist?: Json
          created_at?: string
          delivered_at?: string | null
          enrollment_id: string
          id?: string
          next_refresh_due?: string | null
        }
        Update: {
          contents_checklist?: Json
          created_at?: string
          delivered_at?: string | null
          enrollment_id?: string
          id?: string
          next_refresh_due?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "go_bags_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "safety_program_enrollments"
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
      home_safety_assessments: {
        Row: {
          adequate_lighting: boolean | null
          assessed_by: string | null
          assessment_date: string
          carbon_monoxide_detector: boolean | null
          clear_pathways: boolean | null
          created_at: string
          emergency_contacts_posted: boolean | null
          fall_risk_score: number | null
          fire_extinguisher_accessible: boolean | null
          follow_up_date: string | null
          food_supply_adequate: boolean | null
          grab_bars_installed: boolean | null
          id: string
          kitchen_accessible: boolean | null
          medical_alert_device: boolean | null
          medication_reminders_set: boolean | null
          medications_organized: boolean | null
          member_id: string
          non_slip_mats: boolean | null
          notes: string | null
          partner_id: string | null
          recommendations: string[] | null
          smoke_detectors_working: boolean | null
          stair_handrails: boolean | null
          status: string
          updated_at: string
        }
        Insert: {
          adequate_lighting?: boolean | null
          assessed_by?: string | null
          assessment_date?: string
          carbon_monoxide_detector?: boolean | null
          clear_pathways?: boolean | null
          created_at?: string
          emergency_contacts_posted?: boolean | null
          fall_risk_score?: number | null
          fire_extinguisher_accessible?: boolean | null
          follow_up_date?: string | null
          food_supply_adequate?: boolean | null
          grab_bars_installed?: boolean | null
          id?: string
          kitchen_accessible?: boolean | null
          medical_alert_device?: boolean | null
          medication_reminders_set?: boolean | null
          medications_organized?: boolean | null
          member_id: string
          non_slip_mats?: boolean | null
          notes?: string | null
          partner_id?: string | null
          recommendations?: string[] | null
          smoke_detectors_working?: boolean | null
          stair_handrails?: boolean | null
          status?: string
          updated_at?: string
        }
        Update: {
          adequate_lighting?: boolean | null
          assessed_by?: string | null
          assessment_date?: string
          carbon_monoxide_detector?: boolean | null
          clear_pathways?: boolean | null
          created_at?: string
          emergency_contacts_posted?: boolean | null
          fall_risk_score?: number | null
          fire_extinguisher_accessible?: boolean | null
          follow_up_date?: string | null
          food_supply_adequate?: boolean | null
          grab_bars_installed?: boolean | null
          id?: string
          kitchen_accessible?: boolean | null
          medical_alert_device?: boolean | null
          medication_reminders_set?: boolean | null
          medications_organized?: boolean | null
          member_id?: string
          non_slip_mats?: boolean | null
          notes?: string | null
          partner_id?: string | null
          recommendations?: string[] | null
          smoke_detectors_working?: boolean | null
          stair_handrails?: boolean | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_safety_assessments_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_safety_assessments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_safety_assessments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "community_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      home_safety_checks: {
        Row: {
          assessor_family_member_id: string | null
          assessor_volunteer_id: string | null
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          member_id: string
          mode: string
          report_pdf_path: string | null
          scheduled_at: string | null
          status: string
        }
        Insert: {
          assessor_family_member_id?: string | null
          assessor_volunteer_id?: string | null
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          member_id: string
          mode?: string
          report_pdf_path?: string | null
          scheduled_at?: string | null
          status?: string
        }
        Update: {
          assessor_family_member_id?: string | null
          assessor_volunteer_id?: string | null
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          member_id?: string
          mode?: string
          report_pdf_path?: string | null
          scheduled_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_safety_checks_assessor_family_member_id_fkey"
            columns: ["assessor_family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_safety_checks_assessor_volunteer_id_fkey"
            columns: ["assessor_volunteer_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_safety_checks_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "safety_program_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_safety_checks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      home_safety_items: {
        Row: {
          check_id: string
          created_at: string
          id: string
          item_key: string
          note: string | null
          photo_path: string | null
          result: string
          room: string
        }
        Insert: {
          check_id: string
          created_at?: string
          id?: string
          item_key: string
          note?: string | null
          photo_path?: string | null
          result?: string
          room: string
        }
        Update: {
          check_id?: string
          created_at?: string
          id?: string
          item_key?: string
          note?: string | null
          photo_path?: string | null
          result?: string
          room?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_safety_items_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "home_safety_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      home_sharing_listings: {
        Row: {
          accessibility_features: string[] | null
          accessibility_needed: boolean | null
          age_range_max: number | null
          age_range_min: number | null
          budget_max: number | null
          city: string | null
          created_at: string
          description: string | null
          gender_preference: string | null
          id: string
          listing_type: string
          member_id: string
          move_in_date: string | null
          pets_allowed: boolean | null
          private_bathroom: boolean | null
          quiet_household: boolean | null
          rent_amount: number | null
          rooms_available: number | null
          shared_meals: boolean | null
          smoking_allowed: boolean | null
          state: string | null
          status: string
          updated_at: string
          utilities_included: boolean | null
          zip: string | null
        }
        Insert: {
          accessibility_features?: string[] | null
          accessibility_needed?: boolean | null
          age_range_max?: number | null
          age_range_min?: number | null
          budget_max?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          gender_preference?: string | null
          id?: string
          listing_type: string
          member_id: string
          move_in_date?: string | null
          pets_allowed?: boolean | null
          private_bathroom?: boolean | null
          quiet_household?: boolean | null
          rent_amount?: number | null
          rooms_available?: number | null
          shared_meals?: boolean | null
          smoking_allowed?: boolean | null
          state?: string | null
          status?: string
          updated_at?: string
          utilities_included?: boolean | null
          zip?: string | null
        }
        Update: {
          accessibility_features?: string[] | null
          accessibility_needed?: boolean | null
          age_range_max?: number | null
          age_range_min?: number | null
          budget_max?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          gender_preference?: string | null
          id?: string
          listing_type?: string
          member_id?: string
          move_in_date?: string | null
          pets_allowed?: boolean | null
          private_bathroom?: boolean | null
          quiet_household?: boolean | null
          rent_amount?: number | null
          rooms_available?: number | null
          shared_meals?: boolean | null
          smoking_allowed?: boolean | null
          state?: string | null
          status?: string
          updated_at?: string
          utilities_included?: boolean | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_sharing_listings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      home_sharing_matches: {
        Row: {
          created_at: string
          host_listing_id: string
          id: string
          match_score: number | null
          navigator_notes: string | null
          seeker_listing_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          host_listing_id: string
          id?: string
          match_score?: number | null
          navigator_notes?: string | null
          seeker_listing_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          host_listing_id?: string
          id?: string
          match_score?: number | null
          navigator_notes?: string | null
          seeker_listing_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_sharing_matches_host_listing_id_fkey"
            columns: ["host_listing_id"]
            isOneToOne: false
            referencedRelation: "home_sharing_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_sharing_matches_seeker_listing_id_fkey"
            columns: ["seeker_listing_id"]
            isOneToOne: false
            referencedRelation: "home_sharing_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      home_sharing_referrals: {
        Row: {
          budget_description: string | null
          consent_shared_at: string | null
          created_at: string
          desired_location: string | null
          home_description: string | null
          house_rules: string | null
          id: string
          matched_member_id: string | null
          member_id: string
          move_in_by: string | null
          navigator_id: string | null
          navigator_notes: string | null
          notes: string | null
          preferred_move_in: string | null
          rent_expectation: string | null
          role: Database["public"]["Enums"]["home_sharing_role"] | null
          status: Database["public"]["Enums"]["home_sharing_status"]
          updated_at: string
        }
        Insert: {
          budget_description?: string | null
          consent_shared_at?: string | null
          created_at?: string
          desired_location?: string | null
          home_description?: string | null
          house_rules?: string | null
          id?: string
          matched_member_id?: string | null
          member_id: string
          move_in_by?: string | null
          navigator_id?: string | null
          navigator_notes?: string | null
          notes?: string | null
          preferred_move_in?: string | null
          rent_expectation?: string | null
          role?: Database["public"]["Enums"]["home_sharing_role"] | null
          status?: Database["public"]["Enums"]["home_sharing_status"]
          updated_at?: string
        }
        Update: {
          budget_description?: string | null
          consent_shared_at?: string | null
          created_at?: string
          desired_location?: string | null
          home_description?: string | null
          house_rules?: string | null
          id?: string
          matched_member_id?: string | null
          member_id?: string
          move_in_by?: string | null
          navigator_id?: string | null
          navigator_notes?: string | null
          notes?: string | null
          preferred_move_in?: string | null
          rent_expectation?: string | null
          role?: Database["public"]["Enums"]["home_sharing_role"] | null
          status?: Database["public"]["Enums"]["home_sharing_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_sharing_referrals_matched_member_id_fkey"
            columns: ["matched_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_sharing_referrals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_sharing_referrals_navigator_id_fkey"
            columns: ["navigator_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_referrals: {
        Row: {
          authored_on: string
          created_at: string
          fhir_request_id: string | null
          id: string
          member_id: string
          priority: string
          raw_payload: Json | null
          reason_code: string | null
          reason_text: string | null
          referring_org: string | null
          status: string
        }
        Insert: {
          authored_on?: string
          created_at?: string
          fhir_request_id?: string | null
          id?: string
          member_id: string
          priority?: string
          raw_payload?: Json | null
          reason_code?: string | null
          reason_text?: string | null
          referring_org?: string | null
          status?: string
        }
        Update: {
          authored_on?: string
          created_at?: string
          fhir_request_id?: string | null
          id?: string
          member_id?: string
          priority?: string
          raw_payload?: Json | null
          reason_code?: string | null
          reason_text?: string | null
          referring_org?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_referrals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
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
      interest_circles: {
        Row: {
          category: string
          cover_emoji: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          member_count: number
          name: string
          slug: string
        }
        Insert: {
          category?: string
          cover_emoji?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          member_count?: number
          name: string
          slug: string
        }
        Update: {
          category?: string
          cover_emoji?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          member_count?: number
          name?: string
          slug?: string
        }
        Relationships: []
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
      life_transition_steps: {
        Row: {
          completed_at: string | null
          id: string
          navigator_task_id: string | null
          scheduled_for: string | null
          skipped_at: string | null
          step_key: string
          transition_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          navigator_task_id?: string | null
          scheduled_for?: string | null
          skipped_at?: string | null
          step_key: string
          transition_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          navigator_task_id?: string | null
          scheduled_for?: string | null
          skipped_at?: string | null
          step_key?: string
          transition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_transition_steps_transition_id_fkey"
            columns: ["transition_id"]
            isOneToOne: false
            referencedRelation: "life_transitions"
            referencedColumns: ["id"]
          },
        ]
      }
      life_transitions: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          member_id: string
          metadata: Json
          navigator_notified: boolean
          navigator_notified_at: string | null
          notes: string | null
          occurred_on: string | null
          pathway: string | null
          started_at: string
          status: string
          transition_type: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          member_id: string
          metadata?: Json
          navigator_notified?: boolean
          navigator_notified_at?: string | null
          notes?: string | null
          occurred_on?: string | null
          pathway?: string | null
          started_at?: string
          status?: string
          transition_type: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          member_id?: string
          metadata?: Json
          navigator_notified?: boolean
          navigator_notified_at?: string | null
          notes?: string | null
          occurred_on?: string | null
          pathway?: string | null
          started_at?: string
          status?: string
          transition_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_transitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "life_transitions_member_id_fkey"
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
      local_partners: {
        Row: {
          address: string | null
          category: string
          city: string | null
          created_at: string
          description: string | null
          discount_code: string | null
          discount_description: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          metro_area_id: string | null
          name: string
          phone: string | null
          state: string | null
          updated_at: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          category: string
          city?: string | null
          created_at?: string
          description?: string | null
          discount_code?: string | null
          discount_description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          metro_area_id?: string | null
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          city?: string | null
          created_at?: string
          description?: string | null
          discount_code?: string | null
          discount_description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          metro_area_id?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "local_partners_metro_area_id_fkey"
            columns: ["metro_area_id"]
            isOneToOne: false
            referencedRelation: "metro_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_providers: {
        Row: {
          base_price_cents: number | null
          booking_url: string | null
          category: string
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          metadata: Json
          name: string
          partner_name: string | null
          phone: string | null
          pricing_model: string | null
          rating: number | null
          requires_plan: string | null
          review_count: number
          service_areas: string[] | null
          updated_at: string
        }
        Insert: {
          base_price_cents?: number | null
          booking_url?: string | null
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          metadata?: Json
          name: string
          partner_name?: string | null
          phone?: string | null
          pricing_model?: string | null
          rating?: number | null
          requires_plan?: string | null
          review_count?: number
          service_areas?: string[] | null
          updated_at?: string
        }
        Update: {
          base_price_cents?: number | null
          booking_url?: string | null
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          metadata?: Json
          name?: string
          partner_name?: string | null
          phone?: string | null
          pricing_model?: string | null
          rating?: number | null
          requires_plan?: string | null
          review_count?: number
          service_areas?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_transactions: {
        Row: {
          amount_cents: number
          canceled_at: string | null
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          member_id: string
          member_rating: number | null
          member_review: string | null
          metadata: Json
          navigator_notes: string | null
          provider_id: string
          scheduled_for: string | null
          service_booking_id: string | null
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          canceled_at?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          member_id: string
          member_rating?: number | null
          member_review?: string | null
          metadata?: Json
          navigator_notes?: string | null
          provider_id: string
          scheduled_for?: string | null
          service_booking_id?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          canceled_at?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          member_id?: string
          member_rating?: number | null
          member_review?: string | null
          metadata?: Json
          navigator_notes?: string | null
          provider_id?: string
          scheduled_for?: string | null
          service_booking_id?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_transactions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "marketplace_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_transactions_service_booking_id_fkey"
            columns: ["service_booking_id"]
            isOneToOne: false
            referencedRelation: "service_bookings"
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
      member_achievements: {
        Row: {
          created_at: string
          id: string
          member_id: string
          metadata: Json | null
          occurred_at: string
          shared_with_family: boolean
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          metadata?: Json | null
          occurred_at?: string
          shared_with_family?: boolean
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          metadata?: Json | null
          occurred_at?: string
          shared_with_family?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_achievements_member_id_fkey"
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
      member_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          featured: boolean
          goal_amount: number | null
          id: string
          member_id: string
          navigator_notes: string | null
          need_type: string
          org_id: string | null
          partner_id: string | null
          raised_amount: number
          status: string
          story: string
          title: string
          updated_at: string
          volunteer_slots: number | null
          volunteers_filled: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          featured?: boolean
          goal_amount?: number | null
          id?: string
          member_id: string
          navigator_notes?: string | null
          need_type: string
          org_id?: string | null
          partner_id?: string | null
          raised_amount?: number
          status?: string
          story: string
          title: string
          updated_at?: string
          volunteer_slots?: number | null
          volunteers_filled?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          featured?: boolean
          goal_amount?: number | null
          id?: string
          member_id?: string
          navigator_notes?: string | null
          need_type?: string
          org_id?: string | null
          partner_id?: string | null
          raised_amount?: number
          status?: string
          story?: string
          title?: string
          updated_at?: string
          volunteer_slots?: number | null
          volunteers_filled?: number
        }
        Relationships: [
          {
            foreignKeyName: "member_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_campaigns_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_campaigns_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "community_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      member_celebrations: {
        Row: {
          celebration_type: string
          created_at: string
          family_notify: boolean
          id: string
          last_triggered: string | null
          member_id: string
          notes: string | null
          recurring: boolean
          scheduled_date: string
          status: string
          title: string
        }
        Insert: {
          celebration_type: string
          created_at?: string
          family_notify?: boolean
          id?: string
          last_triggered?: string | null
          member_id: string
          notes?: string | null
          recurring?: boolean
          scheduled_date: string
          status?: string
          title: string
        }
        Update: {
          celebration_type?: string
          created_at?: string
          family_notify?: boolean
          id?: string
          last_triggered?: string | null
          member_id?: string
          notes?: string | null
          recurring?: boolean
          scheduled_date?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_celebrations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          intro_note: string | null
          introduced_by: string | null
          recipient_accepted: boolean
          requester_accepted: boolean
          requester_id: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          intro_note?: string | null
          introduced_by?: string | null
          recipient_accepted?: boolean
          requester_accepted?: boolean
          requester_id: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          intro_note?: string | null
          introduced_by?: string | null
          recipient_accepted?: boolean
          requester_accepted?: boolean
          requester_id?: string
          responded_at?: string | null
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
            foreignKeyName: "member_connections_introduced_by_fkey"
            columns: ["introduced_by"]
            isOneToOne: false
            referencedRelation: "family_members"
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
      member_cultural_interests: {
        Row: {
          created_at: string
          cultural_tag: string
          id: string
          member_id: string
        }
        Insert: {
          created_at?: string
          cultural_tag: string
          id?: string
          member_id: string
        }
        Update: {
          created_at?: string
          cultural_tag?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_cultural_interests_member_id_fkey"
            columns: ["member_id"]
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
      member_messages: {
        Row: {
          body: string
          conversation_key: string | null
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_key?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_key?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_messages_sender_id_fkey"
            columns: ["sender_id"]
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
      member_partners: {
        Row: {
          created_at: string
          id: string
          member_id: string
          notes: string | null
          partner_id: string
          relationship: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          notes?: string | null
          partner_id: string
          relationship?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          notes?: string | null
          partner_id?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_partners_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_partners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "community_partners"
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
      member_plans: {
        Row: {
          assigned_by: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          id: string
          member_id: string
          notes: string | null
          plan_id: string
          started_at: string
          status: string
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          member_id: string
          notes?: string | null
          plan_id: string
          started_at?: string
          status?: string
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          member_id?: string
          notes?: string | null
          plan_id?: string
          started_at?: string
          status?: string
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_plans_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_plans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          aria_call_opted_in: boolean
          auth_id: string | null
          billing_entity: string
          birth_date: string | null
          birth_date_year_hidden: boolean
          buddy_call_length_preference: string | null
          buddy_intro_note: string | null
          buddy_match_era: string | null
          buddy_match_topics: string[] | null
          call_frequency_preference: string
          celebration_opt_out: boolean
          check_in_frequency: Database["public"]["Enums"]["check_in_frequency"]
          checkin_preference: string
          cognitive_concern_score: number
          corporate_account_id: string | null
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
          fall_risk_level: string | null
          family_can_see_alerts: boolean
          family_can_see_call_summaries: boolean
          family_can_see_mood: boolean
          family_can_see_service_history: boolean
          fitness_goal: string | null
          full_name: string
          grief_enrolled_at: string | null
          grief_loss_type: string | null
          grief_welcome_path: boolean
          has_active_buddy: boolean
          health_conditions: string | null
          id: string
          insurance_group_number: string | null
          insurance_policy_number: string | null
          insurance_provider: string | null
          is_veteran: boolean
          last_aria_call_at: string | null
          last_cognitive_activity_at: string | null
          lives_alone: boolean | null
          medicaid_eligible: boolean
          medicare_advantage_plan: string | null
          medicare_number: string | null
          medicare_part_a: boolean
          medicare_part_b: boolean
          medicare_part_d: boolean
          medications: string | null
          memory_care_pathway: boolean
          metro_area_id: string | null
          migration_status: string
          ml_insights_opt_out: boolean
          mobility_devices: string[] | null
          onboarding_call_attempts: number
          onboarding_call_completed: boolean
          onboarding_call_scheduled_at: string | null
          pcp_fax: string | null
          pcp_phone: string | null
          phone_number: string
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          preferred_call_time: string | null
          preferred_contact_method: string
          preferred_language: string
          preferred_name: string
          primary_care_physician: string | null
          pt_referral_date: string | null
          pt_referral_requested: boolean
          risk_override_calls: boolean
          status: Database["public"]["Enums"]["member_status"]
          supabase_auth_id: string | null
          timezone: string
          topics_avoid: string | null
          topics_enjoy: string[] | null
          wandering_prevention_plan: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          aria_call_opted_in?: boolean
          auth_id?: string | null
          billing_entity?: string
          birth_date?: string | null
          birth_date_year_hidden?: boolean
          buddy_call_length_preference?: string | null
          buddy_intro_note?: string | null
          buddy_match_era?: string | null
          buddy_match_topics?: string[] | null
          call_frequency_preference?: string
          celebration_opt_out?: boolean
          check_in_frequency?: Database["public"]["Enums"]["check_in_frequency"]
          checkin_preference?: string
          cognitive_concern_score?: number
          corporate_account_id?: string | null
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
          fall_risk_level?: string | null
          family_can_see_alerts?: boolean
          family_can_see_call_summaries?: boolean
          family_can_see_mood?: boolean
          family_can_see_service_history?: boolean
          fitness_goal?: string | null
          full_name: string
          grief_enrolled_at?: string | null
          grief_loss_type?: string | null
          grief_welcome_path?: boolean
          has_active_buddy?: boolean
          health_conditions?: string | null
          id?: string
          insurance_group_number?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_veteran?: boolean
          last_aria_call_at?: string | null
          last_cognitive_activity_at?: string | null
          lives_alone?: boolean | null
          medicaid_eligible?: boolean
          medicare_advantage_plan?: string | null
          medicare_number?: string | null
          medicare_part_a?: boolean
          medicare_part_b?: boolean
          medicare_part_d?: boolean
          medications?: string | null
          memory_care_pathway?: boolean
          metro_area_id?: string | null
          migration_status?: string
          ml_insights_opt_out?: boolean
          mobility_devices?: string[] | null
          onboarding_call_attempts?: number
          onboarding_call_completed?: boolean
          onboarding_call_scheduled_at?: string | null
          pcp_fax?: string | null
          pcp_phone?: string | null
          phone_number: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          preferred_call_time?: string | null
          preferred_contact_method?: string
          preferred_language?: string
          preferred_name: string
          primary_care_physician?: string | null
          pt_referral_date?: string | null
          pt_referral_requested?: boolean
          risk_override_calls?: boolean
          status?: Database["public"]["Enums"]["member_status"]
          supabase_auth_id?: string | null
          timezone?: string
          topics_avoid?: string | null
          topics_enjoy?: string[] | null
          wandering_prevention_plan?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          aria_call_opted_in?: boolean
          auth_id?: string | null
          billing_entity?: string
          birth_date?: string | null
          birth_date_year_hidden?: boolean
          buddy_call_length_preference?: string | null
          buddy_intro_note?: string | null
          buddy_match_era?: string | null
          buddy_match_topics?: string[] | null
          call_frequency_preference?: string
          celebration_opt_out?: boolean
          check_in_frequency?: Database["public"]["Enums"]["check_in_frequency"]
          checkin_preference?: string
          cognitive_concern_score?: number
          corporate_account_id?: string | null
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
          fall_risk_level?: string | null
          family_can_see_alerts?: boolean
          family_can_see_call_summaries?: boolean
          family_can_see_mood?: boolean
          family_can_see_service_history?: boolean
          fitness_goal?: string | null
          full_name?: string
          grief_enrolled_at?: string | null
          grief_loss_type?: string | null
          grief_welcome_path?: boolean
          has_active_buddy?: boolean
          health_conditions?: string | null
          id?: string
          insurance_group_number?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_veteran?: boolean
          last_aria_call_at?: string | null
          last_cognitive_activity_at?: string | null
          lives_alone?: boolean | null
          medicaid_eligible?: boolean
          medicare_advantage_plan?: string | null
          medicare_number?: string | null
          medicare_part_a?: boolean
          medicare_part_b?: boolean
          medicare_part_d?: boolean
          medications?: string | null
          memory_care_pathway?: boolean
          metro_area_id?: string | null
          migration_status?: string
          ml_insights_opt_out?: boolean
          mobility_devices?: string[] | null
          onboarding_call_attempts?: number
          onboarding_call_completed?: boolean
          onboarding_call_scheduled_at?: string | null
          pcp_fax?: string | null
          pcp_phone?: string | null
          phone_number?: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          preferred_call_time?: string | null
          preferred_contact_method?: string
          preferred_language?: string
          preferred_name?: string
          primary_care_physician?: string | null
          pt_referral_date?: string | null
          pt_referral_requested?: boolean
          risk_override_calls?: boolean
          status?: Database["public"]["Enums"]["member_status"]
          supabase_auth_id?: string | null
          timezone?: string
          topics_avoid?: string | null
          topics_enjoy?: string[] | null
          wandering_prevention_plan?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_metro_area_id_fkey"
            columns: ["metro_area_id"]
            isOneToOne: false
            referencedRelation: "metro_areas"
            referencedColumns: ["id"]
          },
        ]
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
      metro_areas: {
        Row: {
          activated_at: string | null
          coordinator_family_member_id: string | null
          created_at: string
          id: string
          member_count: number
          name: string
          slug: string
          state: string
          status: string
          zip_codes: string[]
          zip_prefixes: string[]
        }
        Insert: {
          activated_at?: string | null
          coordinator_family_member_id?: string | null
          created_at?: string
          id?: string
          member_count?: number
          name: string
          slug: string
          state: string
          status?: string
          zip_codes?: string[]
          zip_prefixes?: string[]
        }
        Update: {
          activated_at?: string | null
          coordinator_family_member_id?: string | null
          created_at?: string
          id?: string
          member_count?: number
          name?: string
          slug?: string
          state?: string
          status?: string
          zip_codes?: string[]
          zip_prefixes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "metro_areas_coordinator_family_member_id_fkey"
            columns: ["coordinator_family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_birthday_programs: {
        Row: {
          age: number
          created_at: string
          description: string | null
          gifts: Json | null
          id: string
          is_active: boolean
          program_name: string
          special_call_agent: string | null
          trigger_days_before: number
        }
        Insert: {
          age: number
          created_at?: string
          description?: string | null
          gifts?: Json | null
          id?: string
          is_active?: boolean
          program_name: string
          special_call_agent?: string | null
          trigger_days_before?: number
        }
        Update: {
          age?: number
          created_at?: string
          description?: string | null
          gifts?: Json | null
          id?: string
          is_active?: boolean
          program_name?: string
          special_call_agent?: string | null
          trigger_days_before?: number
        }
        Relationships: []
      }
      ml_insights: {
        Row: {
          action_recommended: string | null
          actioned: boolean
          actioned_at: string | null
          confidence: number
          created_at: string
          expires_at: string | null
          id: string
          insight_type: string
          member_id: string
          metadata: Json | null
          summary: string
        }
        Insert: {
          action_recommended?: string | null
          actioned?: boolean
          actioned_at?: string | null
          confidence: number
          created_at?: string
          expires_at?: string | null
          id?: string
          insight_type: string
          member_id: string
          metadata?: Json | null
          summary: string
        }
        Update: {
          action_recommended?: string | null
          actioned?: boolean
          actioned_at?: string | null
          confidence?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          insight_type?: string
          member_id?: string
          metadata?: Json | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_insights_member_id_fkey"
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
      navigator_introductions: {
        Row: {
          created_at: string
          id: string
          introduced_at: string
          member_id: string
          navigator_id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          introduced_at?: string
          member_id: string
          navigator_id: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          introduced_at?: string
          member_id?: string
          navigator_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "navigator_introductions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigator_introductions_navigator_id_fkey"
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
      navigator_seat_config: {
        Row: {
          created_at: string
          id: string
          max_members: number | null
          monthly_minutes: number
          plan_tier: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_members?: number | null
          monthly_minutes: number
          plan_tier: string
        }
        Update: {
          created_at?: string
          id?: string
          max_members?: number | null
          monthly_minutes?: number
          plan_tier?: string
        }
        Relationships: []
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
          service_subtype: string | null
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
          service_subtype?: string | null
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
          service_subtype?: string | null
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
      navigator_time_entries: {
        Row: {
          activity: string
          created_at: string
          id: string
          logged_at: string
          member_id: string
          minutes: number
          navigator_id: string
        }
        Insert: {
          activity: string
          created_at?: string
          id?: string
          logged_at?: string
          member_id: string
          minutes: number
          navigator_id: string
        }
        Update: {
          activity?: string
          created_at?: string
          id?: string
          logged_at?: string
          member_id?: string
          minutes?: number
          navigator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigator_time_entries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigator_time_entries_navigator_id_fkey"
            columns: ["navigator_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      navigator_time_log: {
        Row: {
          billing_period: string
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          log_type: string
          member_id: string
          navigator_id: string | null
          notes: string | null
          started_at: string
          task_id: string | null
        }
        Insert: {
          billing_period: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          log_type?: string
          member_id: string
          navigator_id?: string | null
          notes?: string | null
          started_at: string
          task_id?: string | null
        }
        Update: {
          billing_period?: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          log_type?: string
          member_id?: string
          navigator_id?: string | null
          notes?: string | null
          started_at?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "navigator_time_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigator_time_log_navigator_id_fkey"
            columns: ["navigator_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      navigator_time_logs: {
        Row: {
          activity_type: string
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          billable: boolean
          created_at: string
          duration_minutes: number
          id: string
          logged_at: string
          member_id: string
          navigator_id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          activity_type?: string
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          billable?: boolean
          created_at?: string
          duration_minutes: number
          id?: string
          logged_at?: string
          member_id: string
          navigator_id: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          activity_type?: string
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          billable?: boolean
          created_at?: string
          duration_minutes?: number
          id?: string
          logged_at?: string
          member_id?: string
          navigator_id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigator_time_logs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigator_time_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigator_time_logs_navigator_id_fkey"
            columns: ["navigator_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      navigator_usage_summary: {
        Row: {
          allocated_minutes: number
          billing_period: string
          id: string
          last_computed_at: string
          member_id: string
          overage_minutes: number
          plan_tier: string
          used_minutes: number
        }
        Insert: {
          allocated_minutes: number
          billing_period: string
          id?: string
          last_computed_at?: string
          member_id: string
          overage_minutes?: number
          plan_tier: string
          used_minutes?: number
        }
        Update: {
          allocated_minutes?: number
          billing_period?: string
          id?: string
          last_computed_at?: string
          member_id?: string
          overage_minutes?: number
          plan_tier?: string
          used_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "navigator_usage_summary_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      neighbor_match_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          member_id: string
          navigator_note: string | null
          status: string
          volunteer_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          member_id: string
          navigator_note?: string | null
          status?: string
          volunteer_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          member_id?: string
          navigator_note?: string | null
          status?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighbor_match_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neighbor_match_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neighbor_match_requests_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
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
      nonprofit_orgs: {
        Row: {
          active_sponsored_count: number
          address_city: string | null
          address_state: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          ein: string | null
          id: string
          is_verified: boolean
          name: string
          org_type: string
          total_referrals: number
          updated_at: string
          website: string | null
        }
        Insert: {
          active_sponsored_count?: number
          address_city?: string | null
          address_state?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          ein?: string | null
          id?: string
          is_verified?: boolean
          name: string
          org_type: string
          total_referrals?: number
          updated_at?: string
          website?: string | null
        }
        Update: {
          active_sponsored_count?: number
          address_city?: string | null
          address_state?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          ein?: string | null
          id?: string
          is_verified?: boolean
          name?: string
          org_type?: string
          total_referrals?: number
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      nonprofit_referrals: {
        Row: {
          created_at: string
          decline_reason: string | null
          financial_need_confirmed: boolean
          id: string
          member_id: string | null
          nonprofit_org_id: string
          reason_for_referral: string
          senior_address_city: string | null
          senior_address_state: string | null
          senior_dob_year: number | null
          senior_email: string | null
          senior_full_name: string
          senior_phone: string
          sponsored_membership_id: string | null
          status: string
          tier_requested: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decline_reason?: string | null
          financial_need_confirmed?: boolean
          id?: string
          member_id?: string | null
          nonprofit_org_id: string
          reason_for_referral: string
          senior_address_city?: string | null
          senior_address_state?: string | null
          senior_dob_year?: number | null
          senior_email?: string | null
          senior_full_name: string
          senior_phone: string
          sponsored_membership_id?: string | null
          status?: string
          tier_requested: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decline_reason?: string | null
          financial_need_confirmed?: boolean
          id?: string
          member_id?: string | null
          nonprofit_org_id?: string
          reason_for_referral?: string
          senior_address_city?: string | null
          senior_address_state?: string | null
          senior_dob_year?: number | null
          senior_email?: string | null
          senior_full_name?: string
          senior_phone?: string
          sponsored_membership_id?: string | null
          status?: string
          tier_requested?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sponsored_membership"
            columns: ["sponsored_membership_id"]
            isOneToOne: false
            referencedRelation: "sponsored_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nonprofit_referrals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nonprofit_referrals_nonprofit_org_id_fkey"
            columns: ["nonprofit_org_id"]
            isOneToOne: false
            referencedRelation: "nonprofit_orgs"
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
      notification_queue: {
        Row: {
          channel: string
          created_at: string
          device_token: string | null
          email: string | null
          error: string | null
          failed_at: string | null
          id: string
          member_id: string | null
          message: string
          metadata: Json | null
          phone: string | null
          priority: number
          retry_count: number
          scheduled_at: string
          send_after: string
          sent_at: string | null
          status: string
          subject: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          device_token?: string | null
          email?: string | null
          error?: string | null
          failed_at?: string | null
          id?: string
          member_id?: string | null
          message: string
          metadata?: Json | null
          phone?: string | null
          priority?: number
          retry_count?: number
          scheduled_at?: string
          send_after?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          device_token?: string | null
          email?: string | null
          error?: string | null
          failed_at?: string | null
          id?: string
          member_id?: string | null
          message?: string
          metadata?: Json | null
          phone?: string | null
          priority?: number
          retry_count?: number
          scheduled_at?: string
          send_after?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_member_id_fkey"
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
      onboarding_sessions: {
        Row: {
          address: string | null
          call_ended_at: string | null
          conditions: string | null
          created_at: string
          dob: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          error_type: string | null
          family_member_id: string | null
          first_name: string | null
          id: string
          last_name: string | null
          medications: string | null
          name_spelling_confirmed: boolean | null
          phone: string | null
          preferred_name: string | null
          retell_call_id: string | null
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          call_ended_at?: string | null
          conditions?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          error_type?: string | null
          family_member_id?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          medications?: string | null
          name_spelling_confirmed?: boolean | null
          phone?: string | null
          preferred_name?: string | null
          retell_call_id?: string | null
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          call_ended_at?: string | null
          conditions?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          error_type?: string | null
          family_member_id?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          medications?: string | null
          name_spelling_confirmed?: boolean | null
          phone?: string | null
          preferred_name?: string | null
          retell_call_id?: string | null
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_sessions_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      oral_history_entries: {
        Row: {
          approved_by: string | null
          created_at: string
          decade: string | null
          id: string
          is_public: boolean
          member_id: string
          recorded_at: string
          story_text: string
          themes: string[] | null
          title: string
          voice_note_url: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          decade?: string | null
          id?: string
          is_public?: boolean
          member_id: string
          recorded_at?: string
          story_text: string
          themes?: string[] | null
          title: string
          voice_note_url?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          decade?: string | null
          id?: string
          is_public?: boolean
          member_id?: string
          recorded_at?: string
          story_text?: string
          themes?: string[] | null
          title?: string
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oral_history_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oral_history_entries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
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
      org_enrollment_payments: {
        Row: {
          amount_cents: number
          completed_at: string | null
          contact_email: string
          contact_name: string
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          org_id: string | null
          org_name: string
          org_type: string
          status: string
          stripe_customer_id: string | null
          stripe_pi_id: string | null
          stripe_session_id: string
        }
        Insert: {
          amount_cents?: number
          completed_at?: string | null
          contact_email: string
          contact_name: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          org_name: string
          org_type: string
          status?: string
          stripe_customer_id?: string | null
          stripe_pi_id?: string | null
          stripe_session_id: string
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          contact_email?: string
          contact_name?: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          org_name?: string
          org_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_pi_id?: string | null
          stripe_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_enrollment_payments_org_id_fkey"
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
      org_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          member_id: string | null
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          member_id?: string | null
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          member_id?: string | null
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      organizations: {
        Row: {
          active: boolean
          address: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          enrolled: number
          id: string
          member_limit: number
          name: string
          org_type: string | null
          phone: string | null
          plan: string
          slug: string
          state: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          enrolled?: number
          id?: string
          member_limit?: number
          name: string
          org_type?: string | null
          phone?: string | null
          plan?: string
          slug: string
          state?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          enrolled?: number
          id?: string
          member_limit?: number
          name?: string
          org_type?: string | null
          phone?: string | null
          plan?: string
          slug?: string
          state?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
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
      partner_listings: {
        Row: {
          address: string | null
          bio: string | null
          categories: string[] | null
          category: string
          city: string | null
          created_at: string | null
          email: string | null
          featured: boolean | null
          id: string
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          state: string | null
          updated_at: string | null
          verified: boolean | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          categories?: string[] | null
          category: string
          city?: string | null
          created_at?: string | null
          email?: string | null
          featured?: boolean | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          state?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          categories?: string[] | null
          category?: string
          city?: string | null
          created_at?: string | null
          email?: string | null
          featured?: boolean | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          state?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      partner_referrals: {
        Row: {
          created_at: string
          id: string
          member_id: string
          outcome_note: string | null
          partner_id: string
          reason: string | null
          referred_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          outcome_note?: string | null
          partner_id: string
          reason?: string | null
          referred_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          outcome_note?: string | null
          partner_id?: string
          reason?: string | null
          referred_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_referrals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "community_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_referrals_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "family_members"
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
      pet_milestones: {
        Row: {
          created_at: string
          id: string
          member_id: string
          notes: string | null
          occurred_at: string
          pet_id: string
          shared_with_family: boolean
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          notes?: string | null
          occurred_at: string
          pet_id: string
          shared_with_family?: boolean
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          notes?: string | null
          occurred_at?: string
          pet_id?: string
          shared_with_family?: boolean
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_milestones_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_milestones_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "member_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_comparison_features: {
        Row: {
          basic: string
          category: string
          complete: string
          feature: string
          id: string
          premier: string
          sort_order: number
        }
        Insert: {
          basic?: string
          category?: string
          complete?: string
          feature: string
          id?: string
          premier?: string
          sort_order?: number
        }
        Update: {
          basic?: string
          category?: string
          complete?: string
          feature?: string
          id?: string
          premier?: string
          sort_order?: number
        }
        Relationships: []
      }
      plan_entitlements: {
        Row: {
          buddy_matching: boolean
          concierge_access: boolean
          created_at: string
          crisis_line_access: boolean
          cultural_circles: boolean
          family_app_seats: number
          fhir_export: boolean
          id: string
          monthly_ai_call_minutes: number
          monthly_navigator_sessions: number
          plan_tier: string
          tracked_items_limit: number
          updated_at: string
          volunteer_matching: boolean
        }
        Insert: {
          buddy_matching?: boolean
          concierge_access?: boolean
          created_at?: string
          crisis_line_access?: boolean
          cultural_circles?: boolean
          family_app_seats?: number
          fhir_export?: boolean
          id?: string
          monthly_ai_call_minutes?: number
          monthly_navigator_sessions?: number
          plan_tier: string
          tracked_items_limit?: number
          updated_at?: string
          volunteer_matching?: boolean
        }
        Update: {
          buddy_matching?: boolean
          concierge_access?: boolean
          created_at?: string
          crisis_line_access?: boolean
          cultural_circles?: boolean
          family_app_seats?: number
          fhir_export?: boolean
          id?: string
          monthly_ai_call_minutes?: number
          monthly_navigator_sessions?: number
          plan_tier?: string
          tracked_items_limit?: number
          updated_at?: string
          volunteer_matching?: boolean
        }
        Relationships: []
      }
      plans: {
        Row: {
          billing_interval: string
          created_at: string
          description: string | null
          entitlements: Json
          id: string
          is_active: boolean
          name: string
          price_cents: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          description?: string | null
          entitlements?: Json
          id?: string
          is_active?: boolean
          name: string
          price_cents?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          description?: string | null
          entitlements?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
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
      premier_inquiries: {
        Row: {
          created_at: string
          email: string
          for_self: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          situation: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          for_self?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          situation?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          for_self?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          situation?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      private_messages: {
        Row: {
          body: string
          created_at: string
          flagged: boolean
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          flagged?: boolean
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          flagged?: boolean
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
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
      ride_bookings: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          driver_name: string | null
          driver_phone: string | null
          dropoff_address: string | null
          event_id: string | null
          id: string
          member_id: string
          notes: string | null
          pickup_address: string | null
          pickup_time: string | null
          requested_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          dropoff_address?: string | null
          event_id?: string | null
          id?: string
          member_id: string
          notes?: string | null
          pickup_address?: string | null
          pickup_time?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          dropoff_address?: string | null
          event_id?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          pickup_address?: string | null
          pickup_time?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_bookings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_bookings_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
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
      safety_program_enrollments: {
        Row: {
          comments: string | null
          consent_terms_at: string | null
          created_at: string
          home_type: string
          id: string
          income_qualified: boolean | null
          member_id: string
          program_id: string
          status: string
          volunteer_id: string | null
        }
        Insert: {
          comments?: string | null
          consent_terms_at?: string | null
          created_at?: string
          home_type?: string
          id?: string
          income_qualified?: boolean | null
          member_id: string
          program_id: string
          status?: string
          volunteer_id?: string | null
        }
        Update: {
          comments?: string | null
          consent_terms_at?: string | null
          created_at?: string
          home_type?: string
          id?: string
          income_qualified?: boolean | null
          member_id?: string
          program_id?: string
          status?: string
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_program_enrollments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "safety_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_program_enrollments_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_program_volunteers: {
        Row: {
          created_at: string
          id: string
          max_households: number
          program_id: string
          trained_at: string | null
          volunteer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_households?: number
          program_id: string
          trained_at?: string | null
          volunteer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_households?: number
          program_id?: string
          trained_at?: string | null
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_program_volunteers_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "safety_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_program_volunteers_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_programs: {
        Row: {
          capacity_households: number
          contractor_partner_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          eligibility: Json
          ends_on: string | null
          enrollment_open: boolean
          free_item_budget_cents: number
          id: string
          income_referral_partner_id: string | null
          name: string
          org_id: string | null
          program_year: string
          sponsors: Json
          starts_on: string | null
          subsidy_per_home_cents: number
        }
        Insert: {
          capacity_households?: number
          contractor_partner_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligibility?: Json
          ends_on?: string | null
          enrollment_open?: boolean
          free_item_budget_cents?: number
          id?: string
          income_referral_partner_id?: string | null
          name: string
          org_id?: string | null
          program_year: string
          sponsors?: Json
          starts_on?: string | null
          subsidy_per_home_cents?: number
        }
        Update: {
          capacity_households?: number
          contractor_partner_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligibility?: Json
          ends_on?: string | null
          enrollment_open?: boolean
          free_item_budget_cents?: number
          id?: string
          income_referral_partner_id?: string | null
          name?: string
          org_id?: string | null
          program_year?: string
          sponsors?: Json
          starts_on?: string | null
          subsidy_per_home_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "safety_programs_contractor_partner_id_fkey"
            columns: ["contractor_partner_id"]
            isOneToOne: false
            referencedRelation: "community_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_programs_income_referral_partner_id_fkey"
            columns: ["income_referral_partner_id"]
            isOneToOne: false
            referencedRelation: "community_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_proposal_lines: {
        Row: {
          accepted: boolean | null
          community_partner_referral_id: string | null
          completed_at: string | null
          contractor_discount_cents: number
          created_at: string
          description: string
          est_cost_cents: number
          id: string
          item_key: string
          member_cost_cents: number
          proposal_id: string
          route: string
          subsidy_cents: number
          verified_by_volunteer_at: string | null
          work_order_status: string
        }
        Insert: {
          accepted?: boolean | null
          community_partner_referral_id?: string | null
          completed_at?: string | null
          contractor_discount_cents?: number
          created_at?: string
          description: string
          est_cost_cents?: number
          id?: string
          item_key: string
          member_cost_cents?: number
          proposal_id: string
          route?: string
          subsidy_cents?: number
          verified_by_volunteer_at?: string | null
          work_order_status?: string
        }
        Update: {
          accepted?: boolean | null
          community_partner_referral_id?: string | null
          completed_at?: string | null
          contractor_discount_cents?: number
          created_at?: string
          description?: string
          est_cost_cents?: number
          id?: string
          item_key?: string
          member_cost_cents?: number
          proposal_id?: string
          route?: string
          subsidy_cents?: number
          verified_by_volunteer_at?: string | null
          work_order_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_proposal_lines_community_partner_referral_id_fkey"
            columns: ["community_partner_referral_id"]
            isOneToOne: false
            referencedRelation: "partner_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_proposal_lines_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "safety_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_proposals: {
        Row: {
          created_at: string
          enrollment_id: string
          id: string
          responded_at: string | null
          sent_at: string | null
          status: string
          tier_key: string
          total_free_cents: number
          total_member_cents: number
          total_subsidy_cents: number
        }
        Insert: {
          created_at?: string
          enrollment_id: string
          id?: string
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          tier_key: string
          total_free_cents?: number
          total_member_cents?: number
          total_subsidy_cents?: number
        }
        Update: {
          created_at?: string
          enrollment_id?: string
          id?: string
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          tier_key?: string
          total_free_cents?: number
          total_member_cents?: number
          total_subsidy_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "safety_proposals_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "safety_program_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_work_tiers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          label: string
          program_id: string
          tier_key: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          label: string
          program_id: string
          tier_key: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          program_id?: string
          tier_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_work_tiers_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "safety_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      school_partners: {
        Row: {
          active: boolean
          contact_email: string
          contact_name: string
          created_at: string
          grade_band: string
          id: string
          name: string
          slug: string
          student_count: number
        }
        Insert: {
          active?: boolean
          contact_email: string
          contact_name: string
          created_at?: string
          grade_band: string
          id?: string
          name: string
          slug: string
          student_count?: number
        }
        Update: {
          active?: boolean
          contact_email?: string
          contact_name?: string
          created_at?: string
          grade_band?: string
          id?: string
          name?: string
          slug?: string
          student_count?: number
        }
        Relationships: []
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
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          final_amount: number | null
          id: string
          member_address: string | null
          member_id: string
          navigator_id: string | null
          notes: string | null
          partner_id: string
          quoted_amount: number | null
          scheduled_at: string | null
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          final_amount?: number | null
          id?: string
          member_address?: string | null
          member_id: string
          navigator_id?: string | null
          notes?: string | null
          partner_id: string
          quoted_amount?: number | null
          scheduled_at?: string | null
          service_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          final_amount?: number | null
          id?: string
          member_address?: string | null
          member_id?: string
          navigator_id?: string | null
          notes?: string | null
          partner_id?: string
          quoted_amount?: number | null
          scheduled_at?: string | null
          service_type?: string
          status?: string
          updated_at?: string
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
            foreignKeyName: "service_bookings_navigator_id_fkey"
            columns: ["navigator_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "service_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      service_partners: {
        Row: {
          base_rate: number | null
          category: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_active: boolean
          is_vetted: boolean
          logo_url: string | null
          metadata: Json | null
          name: string
          org_id: string | null
          phone: string | null
          rate_unit: string | null
          rating: number | null
          review_count: number | null
          service_areas: string[] | null
          slug: string
          stripe_acct: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          base_rate?: number | null
          category: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_vetted?: boolean
          logo_url?: string | null
          metadata?: Json | null
          name: string
          org_id?: string | null
          phone?: string | null
          rate_unit?: string | null
          rating?: number | null
          review_count?: number | null
          service_areas?: string[] | null
          slug: string
          stripe_acct?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          base_rate?: number | null
          category?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_vetted?: boolean
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          org_id?: string | null
          phone?: string | null
          rate_unit?: string | null
          rating?: number | null
          review_count?: number | null
          service_areas?: string[] | null
          slug?: string
          stripe_acct?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_partners_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
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
      sms_notifications: {
        Row: {
          body: string
          created_at: string
          family_member_id: string
          id: string
          member_id: string | null
          notification_type: string
          phone_to: string
          provider_message_id: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          body: string
          created_at?: string
          family_member_id: string
          id?: string
          member_id?: string | null
          notification_type: string
          phone_to: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          body?: string
          created_at?: string
          family_member_id?: string
          id?: string
          member_id?: string | null
          notification_type?: string
          phone_to?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_notifications_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_notifications_member_id_fkey"
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
      sponsored_memberships: {
        Row: {
          approved_at: string | null
          created_at: string
          end_date: string | null
          id: string
          member_id: string
          member_monthly_cost_cents: number
          monthly_subsidy_cents: number
          navigator_id: string | null
          navigator_notes: string | null
          nonprofit_org_id: string
          referral_notes: string | null
          renewal_date: string | null
          start_date: string | null
          status: string
          tier: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          member_id: string
          member_monthly_cost_cents?: number
          monthly_subsidy_cents?: number
          navigator_id?: string | null
          navigator_notes?: string | null
          nonprofit_org_id: string
          referral_notes?: string | null
          renewal_date?: string | null
          start_date?: string | null
          status?: string
          tier: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          member_id?: string
          member_monthly_cost_cents?: number
          monthly_subsidy_cents?: number
          navigator_id?: string | null
          navigator_notes?: string | null
          nonprofit_org_id?: string
          referral_notes?: string | null
          renewal_date?: string | null
          start_date?: string | null
          status?: string
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_memberships_navigator_id_fkey"
            columns: ["navigator_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_memberships_nonprofit_org_id_fkey"
            columns: ["nonprofit_org_id"]
            isOneToOne: false
            referencedRelation: "nonprofit_orgs"
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
      time_bank_credits: {
        Row: {
          beneficiary_member_id: string
          created_at: string
          credits: number
          earner_family_member_id: string
          hours_served: number
          id: string
          note: string | null
          performed_for_member_id: string
          redeemed_at: string | null
          redeemed_service_booking_id: string | null
          service_booking_id: string | null
          service_type: string
        }
        Insert: {
          beneficiary_member_id: string
          created_at?: string
          credits: number
          earner_family_member_id: string
          hours_served: number
          id?: string
          note?: string | null
          performed_for_member_id: string
          redeemed_at?: string | null
          redeemed_service_booking_id?: string | null
          service_booking_id?: string | null
          service_type: string
        }
        Update: {
          beneficiary_member_id?: string
          created_at?: string
          credits?: number
          earner_family_member_id?: string
          hours_served?: number
          id?: string
          note?: string | null
          performed_for_member_id?: string
          redeemed_at?: string | null
          redeemed_service_booking_id?: string | null
          service_booking_id?: string | null
          service_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_bank_credits_beneficiary_member_id_fkey"
            columns: ["beneficiary_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_bank_credits_earner_family_member_id_fkey"
            columns: ["earner_family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_bank_credits_performed_for_member_id_fkey"
            columns: ["performed_for_member_id"]
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
      transition_plan_steps: {
        Row: {
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          plan_id: string
          requires_transport: boolean | null
          sort_order: number
          step_number: number | null
          title: string
          transport_request_id: string | null
          week_number: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          requires_transport?: boolean | null
          sort_order?: number
          step_number?: number | null
          title: string
          transport_request_id?: string | null
          week_number: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          requires_transport?: boolean | null
          sort_order?: number
          step_number?: number | null
          title?: string
          transport_request_id?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "transition_plan_steps_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transition_plan_steps_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "transition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      transition_plans: {
        Row: {
          created_at: string
          family_can_see: boolean
          id: string
          member_id: string
          notes: string | null
          pathway: string
          started_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          family_can_see?: boolean
          id?: string
          member_id: string
          notes?: string | null
          pathway: string
          started_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          family_can_see?: boolean
          id?: string
          member_id?: string
          notes?: string | null
          pathway?: string
          started_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "transition_plans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transition_plans_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      transition_resources: {
        Row: {
          description: string | null
          id: string
          pathway: string
          resource_type: string
          sort_order: number
          title: string
          url: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          pathway: string
          resource_type?: string
          sort_order?: number
          title: string
          url?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          pathway?: string
          resource_type?: string
          sort_order?: number
          title?: string
          url?: string | null
        }
        Relationships: []
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
          license_number: string | null
          license_state: string | null
          listing_expires_at: string | null
          listing_fee_annual: number
          listing_started_at: string | null
          listing_status: Database["public"]["Enums"]["advisor_listing_status"]
          listing_tier: Database["public"]["Enums"]["advisor_listing_tier"]
          member_request_only: boolean
          notes: string | null
          offers_free_consult: boolean
          phone: string | null
          service_metros: string[]
          service_states: string[]
          sliding_scale: boolean
          state: string | null
          telehealth_ok: boolean
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
          license_number?: string | null
          license_state?: string | null
          listing_expires_at?: string | null
          listing_fee_annual?: number
          listing_started_at?: string | null
          listing_status?: Database["public"]["Enums"]["advisor_listing_status"]
          listing_tier?: Database["public"]["Enums"]["advisor_listing_tier"]
          member_request_only?: boolean
          notes?: string | null
          offers_free_consult?: boolean
          phone?: string | null
          service_metros?: string[]
          service_states?: string[]
          sliding_scale?: boolean
          state?: string | null
          telehealth_ok?: boolean
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
          license_number?: string | null
          license_state?: string | null
          listing_expires_at?: string | null
          listing_fee_annual?: number
          listing_started_at?: string | null
          listing_status?: Database["public"]["Enums"]["advisor_listing_status"]
          listing_tier?: Database["public"]["Enums"]["advisor_listing_tier"]
          member_request_only?: boolean
          notes?: string | null
          offers_free_consult?: boolean
          phone?: string | null
          service_metros?: string[]
          service_states?: string[]
          sliding_scale?: boolean
          state?: string | null
          telehealth_ok?: boolean
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
      university_partners: {
        Row: {
          active: boolean
          contact_email: string
          contact_name: string
          created_at: string
          enrolled_students: number
          hour_target: number
          id: string
          name: string
          notes: string | null
          semester_end: string | null
          semester_start: string | null
          slug: string
        }
        Insert: {
          active?: boolean
          contact_email: string
          contact_name: string
          created_at?: string
          enrolled_students?: number
          hour_target?: number
          id?: string
          name: string
          notes?: string | null
          semester_end?: string | null
          semester_start?: string | null
          slug: string
        }
        Update: {
          active?: boolean
          contact_email?: string
          contact_name?: string
          created_at?: string
          enrolled_students?: number
          hour_target?: number
          id?: string
          name?: string
          notes?: string | null
          semester_end?: string | null
          semester_start?: string | null
          slug?: string
        }
        Relationships: []
      }
      v2v_referrals: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by_auth: string | null
          enrolled_at: string | null
          from_admin_auth: string
          from_org_id: string
          id: string
          member_id: string
          reason: string | null
          services_needed: string[] | null
          status: string
          status_note: string | null
          to_org_id: string
          updated_at: string
          urgency: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by_auth?: string | null
          enrolled_at?: string | null
          from_admin_auth: string
          from_org_id: string
          id?: string
          member_id: string
          reason?: string | null
          services_needed?: string[] | null
          status?: string
          status_note?: string | null
          to_org_id: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by_auth?: string | null
          enrolled_at?: string | null
          from_admin_auth?: string
          from_org_id?: string
          id?: string
          member_id?: string
          reason?: string | null
          services_needed?: string[] | null
          status?: string
          status_note?: string | null
          to_org_id?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2v_referrals_from_org_id_fkey"
            columns: ["from_org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v2v_referrals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v2v_referrals_to_org_id_fkey"
            columns: ["to_org_id"]
            isOneToOne: false
            referencedRelation: "community_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      veteran_profiles: {
        Row: {
          branch: string | null
          created_at: string
          disability_rating: number | null
          discharge_status: string | null
          id: string
          member_id: string
          notes: string | null
          open_to_peer_connection: boolean
          service_era: string | null
          updated_at: string
          va_enrolled: boolean
          va_facility: string | null
          years_served: number | null
        }
        Insert: {
          branch?: string | null
          created_at?: string
          disability_rating?: number | null
          discharge_status?: string | null
          id?: string
          member_id: string
          notes?: string | null
          open_to_peer_connection?: boolean
          service_era?: string | null
          updated_at?: string
          va_enrolled?: boolean
          va_facility?: string | null
          years_served?: number | null
        }
        Update: {
          branch?: string | null
          created_at?: string
          disability_rating?: number | null
          discharge_status?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          open_to_peer_connection?: boolean
          service_era?: string | null
          updated_at?: string
          va_enrolled?: boolean
          va_facility?: string | null
          years_served?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "veteran_profiles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      veterans_profiles: {
        Row: {
          benefits_enrolled: string[] | null
          branch: string | null
          created_at: string
          discharge_type: string | null
          id: string
          member_id: string
          service_years: string | null
          va_file_number: string | null
          vavs_eligible: boolean
          vavs_enrolled: boolean
          vso_chapter_id: string | null
        }
        Insert: {
          benefits_enrolled?: string[] | null
          branch?: string | null
          created_at?: string
          discharge_type?: string | null
          id?: string
          member_id: string
          service_years?: string | null
          va_file_number?: string | null
          vavs_eligible?: boolean
          vavs_enrolled?: boolean
          vso_chapter_id?: string | null
        }
        Update: {
          benefits_enrolled?: string[] | null
          branch?: string | null
          created_at?: string
          discharge_type?: string | null
          id?: string
          member_id?: string
          service_years?: string | null
          va_file_number?: string | null
          vavs_eligible?: boolean
          vavs_enrolled?: boolean
          vso_chapter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veterans_profiles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vp_vso_fk"
            columns: ["vso_chapter_id"]
            isOneToOne: false
            referencedRelation: "vso_chapters"
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
      volunteer_assignments: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          member_id: string
          notes: string | null
          scheduled_at: string | null
          status: string
          task_type: string
          volunteer_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          member_id: string
          notes?: string | null
          scheduled_at?: string | null
          status?: string
          task_type: string
          volunteer_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          member_id?: string
          notes?: string | null
          scheduled_at?: string | null
          status?: string
          task_type?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_hours: {
        Row: {
          activity_date: string
          assignment_id: string | null
          created_at: string
          description: string | null
          hours: number
          id: string
          member_id: string | null
          verified: boolean
          volunteer_id: string
        }
        Insert: {
          activity_date: string
          assignment_id?: string | null
          created_at?: string
          description?: string | null
          hours: number
          id?: string
          member_id?: string | null
          verified?: boolean
          volunteer_id: string
        }
        Update: {
          activity_date?: string
          assignment_id?: string | null
          created_at?: string
          description?: string | null
          hours?: number
          id?: string
          member_id?: string | null
          verified?: boolean
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_hours_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "volunteer_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_hours_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_hours_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
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
          active_assignment_count: number
          availability_days: string[] | null
          background_check_id: string | null
          background_check_required: boolean
          background_check_status: string | null
          background_checked: boolean
          background_checked_at: string | null
          buddy_active_count: number
          buddy_bio: string | null
          buddy_capacity: number
          buddy_preferences: Json | null
          city: string | null
          corporate_program_id: string | null
          created_at: string
          email: string
          faith_affiliation: string | null
          first_name: string | null
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
          last_name: string | null
          license_state: string | null
          max_assignments: number
          max_hours_per_week: number
          metro_area: string | null
          metro_area_id: string | null
          notes: string | null
          phone: string | null
          prior_experience: string | null
          professional_background: string | null
          professional_specialty: string | null
          rating_average: number | null
          service_types: Database["public"]["Enums"]["visit_type"][] | null
          skills: string[]
          state: string | null
          status: Database["public"]["Enums"]["volunteer_status"]
          student_id_verified: boolean
          supabase_auth_id: string | null
          total_hours: number
          total_hours_logged: number | null
          total_seniors_helped: number | null
          university_partner_id: string | null
          updated_at: string
          volunteer_category: string
          volunteer_specialty: string | null
          vso_affiliation: Database["public"]["Enums"]["vso_affiliation"]
          vso_member_number: string | null
          why_volunteer: string | null
          zip_code: string | null
        }
        Insert: {
          active_assignment_count?: number
          availability_days?: string[] | null
          background_check_id?: string | null
          background_check_required?: boolean
          background_check_status?: string | null
          background_checked?: boolean
          background_checked_at?: string | null
          buddy_active_count?: number
          buddy_bio?: string | null
          buddy_capacity?: number
          buddy_preferences?: Json | null
          city?: string | null
          corporate_program_id?: string | null
          created_at?: string
          email: string
          faith_affiliation?: string | null
          first_name?: string | null
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
          last_name?: string | null
          license_state?: string | null
          max_assignments?: number
          max_hours_per_week?: number
          metro_area?: string | null
          metro_area_id?: string | null
          notes?: string | null
          phone?: string | null
          prior_experience?: string | null
          professional_background?: string | null
          professional_specialty?: string | null
          rating_average?: number | null
          service_types?: Database["public"]["Enums"]["visit_type"][] | null
          skills?: string[]
          state?: string | null
          status?: Database["public"]["Enums"]["volunteer_status"]
          student_id_verified?: boolean
          supabase_auth_id?: string | null
          total_hours?: number
          total_hours_logged?: number | null
          total_seniors_helped?: number | null
          university_partner_id?: string | null
          updated_at?: string
          volunteer_category?: string
          volunteer_specialty?: string | null
          vso_affiliation?: Database["public"]["Enums"]["vso_affiliation"]
          vso_member_number?: string | null
          why_volunteer?: string | null
          zip_code?: string | null
        }
        Update: {
          active_assignment_count?: number
          availability_days?: string[] | null
          background_check_id?: string | null
          background_check_required?: boolean
          background_check_status?: string | null
          background_checked?: boolean
          background_checked_at?: string | null
          buddy_active_count?: number
          buddy_bio?: string | null
          buddy_capacity?: number
          buddy_preferences?: Json | null
          city?: string | null
          corporate_program_id?: string | null
          created_at?: string
          email?: string
          faith_affiliation?: string | null
          first_name?: string | null
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
          last_name?: string | null
          license_state?: string | null
          max_assignments?: number
          max_hours_per_week?: number
          metro_area?: string | null
          metro_area_id?: string | null
          notes?: string | null
          phone?: string | null
          prior_experience?: string | null
          professional_background?: string | null
          professional_specialty?: string | null
          rating_average?: number | null
          service_types?: Database["public"]["Enums"]["visit_type"][] | null
          skills?: string[]
          state?: string | null
          status?: Database["public"]["Enums"]["volunteer_status"]
          student_id_verified?: boolean
          supabase_auth_id?: string | null
          total_hours?: number
          total_hours_logged?: number | null
          total_seniors_helped?: number | null
          university_partner_id?: string | null
          updated_at?: string
          volunteer_category?: string
          volunteer_specialty?: string | null
          vso_affiliation?: Database["public"]["Enums"]["vso_affiliation"]
          vso_member_number?: string | null
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
          {
            foreignKeyName: "volunteers_metro_area_id_fkey"
            columns: ["metro_area_id"]
            isOneToOne: false
            referencedRelation: "metro_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteers_university_partner_id_fkey"
            columns: ["university_partner_id"]
            isOneToOne: false
            referencedRelation: "university_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      vso_chapters: {
        Row: {
          active: boolean
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          organization: string
          state: string
        }
        Insert: {
          active?: boolean
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          organization: string
          state: string
        }
        Update: {
          active?: boolean
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          organization?: string
          state?: string
        }
        Relationships: []
      }
      vso_partners: {
        Row: {
          active: boolean
          affiliation: string
          contact_email: string
          contact_name: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          affiliation: string
          contact_email: string
          contact_name: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          affiliation?: string
          contact_email?: string
          contact_name?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
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
      wellness_scores: {
        Row: {
          check_ins_completed: number
          check_ins_missed: number
          computed_at: string
          engagement_score: number | null
          flags: string[] | null
          id: string
          member_id: string
          score: number
          sentiment_avg: number | null
          week_of: string
        }
        Insert: {
          check_ins_completed?: number
          check_ins_missed?: number
          computed_at?: string
          engagement_score?: number | null
          flags?: string[] | null
          id?: string
          member_id: string
          score: number
          sentiment_avg?: number | null
          week_of: string
        }
        Update: {
          check_ins_completed?: number
          check_ins_missed?: number
          computed_at?: string
          engagement_score?: number | null
          flags?: string[] | null
          id?: string
          member_id?: string
          score?: number
          sentiment_avg?: number | null
          week_of?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_scores_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      youth_activity_types: {
        Row: {
          active: boolean
          description: string
          duration_minutes: number
          grade_band: string
          id: string
          materials: string[] | null
          name: string
        }
        Insert: {
          active?: boolean
          description: string
          duration_minutes?: number
          grade_band: string
          id?: string
          materials?: string[] | null
          name: string
        }
        Update: {
          active?: boolean
          description?: string
          duration_minutes?: number
          grade_band?: string
          id?: string
          materials?: string[] | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acting_member_ids: { Args: never; Returns: string[] }
      age_group_circle_id: { Args: { member_age: number }; Returns: string }
      assign_metro_area: { Args: { member_zip: string }; Returns: string }
      current_member_id: { Args: never; Returns: string }
      get_member_ids_for_auth_user: { Args: never; Returns: string[] }
      haversine_miles: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      increment_nonprofit_active: {
        Args: { org_id: string }
        Returns: undefined
      }
      increment_nonprofit_referrals: {
        Args: { org_id: string }
        Returns: undefined
      }
      is_navigator: { Args: never; Returns: boolean }
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
        | "therapist"
        | "grief_counselor"
        | "chaplain"
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
      campaign_status:
        | "draft"
        | "consent_pending"
        | "active"
        | "fulfilled"
        | "closed"
        | "withdrawn"
      care_worker_role:
        | "caregiver"
        | "nurse"
        | "therapist"
        | "care_coordinator"
        | "social_worker"
        | "other"
      career_interest_status:
        | "interested"
        | "applied"
        | "interviewing"
        | "offered"
        | "declined"
        | "hired"
      career_work_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "volunteer"
        | "consulting"
        | "flexible"
      check_in_frequency: "daily" | "every_other_day" | "weekly"
      contribution_status: "pledged" | "confirmed" | "cancelled"
      contribution_type: "financial" | "in_kind" | "volunteer"
      corp_volunteer_tier: "partner" | "champion" | "leader"
      event_format: "phone_only" | "video_or_phone" | "in_person"
      event_status: "upcoming" | "live" | "completed" | "cancelled"
      home_sharing_role: "host" | "seeker"
      home_sharing_status:
        | "inquiring"
        | "screening"
        | "matched"
        | "trial"
        | "active"
        | "paused"
        | "closed"
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
      opportunity_status: "draft" | "active" | "filled" | "expired" | "archived"
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
      vso_affiliation:
        | "vfw"
        | "american_legion"
        | "dav"
        | "amvets"
        | "moaa"
        | "uso"
        | "other"
        | "none"
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
        "therapist",
        "grief_counselor",
        "chaplain",
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
      campaign_status: [
        "draft",
        "consent_pending",
        "active",
        "fulfilled",
        "closed",
        "withdrawn",
      ],
      care_worker_role: [
        "caregiver",
        "nurse",
        "therapist",
        "care_coordinator",
        "social_worker",
        "other",
      ],
      career_interest_status: [
        "interested",
        "applied",
        "interviewing",
        "offered",
        "declined",
        "hired",
      ],
      career_work_type: [
        "full_time",
        "part_time",
        "contract",
        "volunteer",
        "consulting",
        "flexible",
      ],
      check_in_frequency: ["daily", "every_other_day", "weekly"],
      contribution_status: ["pledged", "confirmed", "cancelled"],
      contribution_type: ["financial", "in_kind", "volunteer"],
      corp_volunteer_tier: ["partner", "champion", "leader"],
      event_format: ["phone_only", "video_or_phone", "in_person"],
      event_status: ["upcoming", "live", "completed", "cancelled"],
      home_sharing_role: ["host", "seeker"],
      home_sharing_status: [
        "inquiring",
        "screening",
        "matched",
        "trial",
        "active",
        "paused",
        "closed",
      ],
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
      opportunity_status: ["draft", "active", "filled", "expired", "archived"],
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
      vso_affiliation: [
        "vfw",
        "american_legion",
        "dav",
        "amvets",
        "moaa",
        "uso",
        "other",
        "none",
      ],
    },
  },
} as const
