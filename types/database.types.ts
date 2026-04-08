/**
 * Supabase `public` schema types for Phase 4.
 * Regenerate from the dashboard CLI later (`supabase gen types`) when the schema drifts.
 */
export type PlanTier = 'free' | 'pro'

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      loyalty_programs: {
        Row: {
          slug: string
          name: string
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          slug: string
          name: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          slug?: string
          name?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          plan_tier: PlanTier
          max_searches_per_day: number
          max_active_alerts: number
          updated_at: string
        }
        Insert: {
          plan_tier: PlanTier
          max_searches_per_day: number
          max_active_alerts: number
          updated_at?: string
        }
        Update: {
          plan_tier?: PlanTier
          max_searches_per_day?: number
          max_active_alerts?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          default_loyalty_program_slug: string
          plan_tier: PlanTier
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          default_loyalty_program_slug?: string
          plan_tier?: PlanTier
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          default_loyalty_program_slug?: string
          plan_tier?: PlanTier
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_default_loyalty_program_slug_fkey'
            columns: ['default_loyalty_program_slug']
            isOneToOne: false
            referencedRelation: 'loyalty_programs'
            referencedColumns: ['slug']
          },
          {
            foreignKeyName: 'profiles_plan_tier_fkey'
            columns: ['plan_tier']
            isOneToOne: false
            referencedRelation: 'plan_limits'
            referencedColumns: ['plan_tier']
          },
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: string
          plan_tier: PlanTier
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: string
          plan_tier?: PlanTier
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: string
          plan_tier?: PlanTier
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'subscriptions_plan_tier_fkey'
            columns: ['plan_tier']
            isOneToOne: false
            referencedRelation: 'plan_limits'
            referencedColumns: ['plan_tier']
          },
        ]
      }
      usage_events: {
        Row: {
          id: string
          user_id: string
          loyalty_program_slug: string | null
          event_type: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          loyalty_program_slug?: string | null
          event_type: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          loyalty_program_slug?: string | null
          event_type?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'usage_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'usage_events_loyalty_program_slug_fkey'
            columns: ['loyalty_program_slug']
            isOneToOne: false
            referencedRelation: 'loyalty_programs'
            referencedColumns: ['slug']
          },
        ]
      }
      search_logs: {
        Row: {
          id: string
          user_id: string
          loyalty_program_slug: string
          params: Json
          result_count: number | null
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          loyalty_program_slug: string
          params?: Json
          result_count?: number | null
          duration_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          loyalty_program_slug?: string
          params?: Json
          result_count?: number | null
          duration_ms?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'search_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'search_logs_loyalty_program_slug_fkey'
            columns: ['loyalty_program_slug']
            isOneToOne: false
            referencedRelation: 'loyalty_programs'
            referencedColumns: ['slug']
          },
        ]
      }
      saved_searches: {
        Row: {
          id: string
          user_id: string
          loyalty_program_slug: string
          label: string | null
          params: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          loyalty_program_slug: string
          label?: string | null
          params?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          loyalty_program_slug?: string
          label?: string | null
          params?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'saved_searches_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'saved_searches_loyalty_program_slug_fkey'
            columns: ['loyalty_program_slug']
            isOneToOne: false
            referencedRelation: 'loyalty_programs'
            referencedColumns: ['slug']
          },
        ]
      }
      availability_cache_entries: {
        Row: {
          id: string
          loyalty_program_slug: string
          fingerprint: string
          search_params: Json
          payload: Json
          source: string
          fetched_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          loyalty_program_slug: string
          fingerprint: string
          search_params?: Json
          payload?: Json
          source?: string
          fetched_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          loyalty_program_slug?: string
          fingerprint?: string
          search_params?: Json
          payload?: Json
          source?: string
          fetched_at?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'availability_cache_entries_loyalty_program_slug_fkey'
            columns: ['loyalty_program_slug']
            isOneToOne: false
            referencedRelation: 'loyalty_programs'
            referencedColumns: ['slug']
          },
        ]
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          loyalty_program_slug: string
          origin_airport: string
          destination_airport: string
          trip_type: 'one_way' | 'round_trip'
          outbound_date_start: string
          outbound_date_end: string | null
          return_date_start: string | null
          return_date_end: string | null
          cabin: 'economy' | 'premium_economy' | 'business' | 'first'
          passenger_count: number
          max_miles: number | null
          max_taxes_amount: string | null
          max_taxes_currency: string | null
          direct_only: boolean
          status: 'active' | 'paused'
          next_check_at: string | null
          last_checked_at: string | null
          check_interval_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          loyalty_program_slug?: string
          origin_airport: string
          destination_airport: string
          trip_type: 'one_way' | 'round_trip'
          outbound_date_start: string
          outbound_date_end?: string | null
          return_date_start?: string | null
          return_date_end?: string | null
          cabin: 'economy' | 'premium_economy' | 'business' | 'first'
          passenger_count?: number
          max_miles?: number | null
          max_taxes_amount?: string | null
          max_taxes_currency?: string | null
          direct_only?: boolean
          status?: 'active' | 'paused'
          next_check_at?: string | null
          last_checked_at?: string | null
          check_interval_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          loyalty_program_slug?: string
          origin_airport?: string
          destination_airport?: string
          trip_type?: 'one_way' | 'round_trip'
          outbound_date_start?: string
          outbound_date_end?: string | null
          return_date_start?: string | null
          return_date_end?: string | null
          cabin?: 'economy' | 'premium_economy' | 'business' | 'first'
          passenger_count?: number
          max_miles?: number | null
          max_taxes_amount?: string | null
          max_taxes_currency?: string | null
          direct_only?: boolean
          status?: 'active' | 'paused'
          next_check_at?: string | null
          last_checked_at?: string | null
          check_interval_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'alerts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'alerts_loyalty_program_slug_fkey'
            columns: ['loyalty_program_slug']
            isOneToOne: false
            referencedRelation: 'loyalty_programs'
            referencedColumns: ['slug']
          },
        ]
      }
      alert_matches: {
        Row: {
          id: string
          alert_id: string
          loyalty_program_slug: string
          matched_at: string
          cache_entry_id: string | null
          summary: string | null
          details: Json
          digest_hash: string | null
        }
        Insert: {
          id?: string
          alert_id: string
          loyalty_program_slug: string
          matched_at?: string
          cache_entry_id?: string | null
          summary?: string | null
          details?: Json
          digest_hash?: string | null
        }
        Update: {
          id?: string
          alert_id?: string
          loyalty_program_slug?: string
          matched_at?: string
          cache_entry_id?: string | null
          summary?: string | null
          details?: Json
          digest_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'alert_matches_alert_id_fkey'
            columns: ['alert_id']
            isOneToOne: false
            referencedRelation: 'alerts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'alert_matches_cache_entry_id_fkey'
            columns: ['cache_entry_id']
            isOneToOne: false
            referencedRelation: 'availability_cache_entries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'alert_matches_loyalty_program_slug_fkey'
            columns: ['loyalty_program_slug']
            isOneToOne: false
            referencedRelation: 'loyalty_programs'
            referencedColumns: ['slug']
          },
        ]
      }
      email_send_logs: {
        Row: {
          id: string
          user_id: string
          email_type: string
          to_email: string
          status: 'skipped' | 'sent' | 'failed'
          provider_message_id: string | null
          error_message: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_type: string
          to_email: string
          status: 'skipped' | 'sent' | 'failed'
          provider_message_id?: string | null
          error_message?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_type?: string
          to_email?: string
          status?: 'skipped' | 'sent' | 'failed'
          provider_message_id?: string | null
          error_message?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'email_send_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
