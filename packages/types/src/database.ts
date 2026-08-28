// Generated from the live Supabase schema. Do not edit by hand.
//
// Regenerate after every migration:
//
//   npm run types:generate
//
// The domain modules in this package derive from these rows and narrow the jsonb
// columns, so this file is the single place where column shapes are described.
// It is excluded from Prettier so regenerated output stays byte-comparable.

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
    PostgrestVersion: "14.17"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          brand_id: string
          created_at: string
          duration_ms: number | null
          estimated_cost: number | null
          generation_type: Database["public"]["Enums"]["generation_type"]
          id: string
          input_json: Json
          model: string
          output_json: Json | null
          post_id: string | null
          provider: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          duration_ms?: number | null
          estimated_cost?: number | null
          generation_type: Database["public"]["Enums"]["generation_type"]
          id?: string
          input_json?: Json
          model: string
          output_json?: Json | null
          post_id?: string | null
          provider: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          duration_ms?: number | null
          estimated_cost?: number | null
          generation_type?: Database["public"]["Enums"]["generation_type"]
          id?: string
          input_json?: Json
          model?: string
          output_json?: Json | null
          post_id?: string | null
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_provider_keys: {
        Row: {
          created_at: string
          id: string
          image_model: string | null
          label: string
          organization_id: string
          provider: Database["public"]["Enums"]["ai_provider"]
          secret_ref: string
          text_model: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_model?: string | null
          label: string
          organization_id: string
          provider: Database["public"]["Enums"]["ai_provider"]
          secret_ref: string
          text_model?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_model?: string | null
          label?: string
          organization_id?: string
          provider?: Database["public"]["Enums"]["ai_provider"]
          secret_ref?: string
          text_model?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_provider_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_quotas: {
        Row: {
          created_at: string
          daily_limit: number
          hourly_limit: number
          monthly_limit: number
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_limit?: number
          hourly_limit?: number
          monthly_limit?: number
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_limit?: number
          hourly_limit?: number
          monthly_limit?: number
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_quotas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_routing: {
        Row: {
          created_at: string
          image_provider_key_id: string | null
          organization_id: string
          text_provider_key_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          image_provider_key_id?: string | null
          organization_id: string
          text_provider_key_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          image_provider_key_id?: string | null
          organization_id?: string
          text_provider_key_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_routing_image_provider_key_id_fkey"
            columns: ["image_provider_key_id"]
            isOneToOne: false
            referencedRelation: "ai_provider_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_routing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_routing_text_provider_key_id_fkey"
            columns: ["text_provider_key_id"]
            isOneToOne: false
            referencedRelation: "ai_provider_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["brand_asset_type"]
          brand_id: string
          created_at: string
          id: string
          metadata: Json | null
          name: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["brand_asset_type"]
          brand_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["brand_asset_type"]
          brand_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_assets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_guidelines: {
        Row: {
          brand_id: string
          content_pillars: Json
          copy_rules: Json | null
          created_at: string
          forbidden_claims: Json
          id: string
          mission: string | null
          positioning: string | null
          target_audience: string | null
          tone_of_voice: Json | null
          updated_at: string
          vision: string | null
          visual_rules: Json | null
        }
        Insert: {
          brand_id: string
          content_pillars?: Json
          copy_rules?: Json | null
          created_at?: string
          forbidden_claims?: Json
          id?: string
          mission?: string | null
          positioning?: string | null
          target_audience?: string | null
          tone_of_voice?: Json | null
          updated_at?: string
          vision?: string | null
          visual_rules?: Json | null
        }
        Update: {
          brand_id?: string
          content_pillars?: Json
          copy_rules?: Json | null
          created_at?: string
          forbidden_claims?: Json
          id?: string
          mission?: string | null
          positioning?: string | null
          target_audience?: string | null
          tone_of_voice?: Json | null
          updated_at?: string
          vision?: string | null
          visual_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_guidelines_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          app_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          slug: string
          status: Database["public"]["Enums"]["brand_status"]
          updated_at: string
        }
        Insert: {
          app_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          slug: string
          status?: Database["public"]["Enums"]["brand_status"]
          updated_at?: string
        }
        Update: {
          app_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["brand_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_strategies: {
        Row: {
          brand_id: string
          created_at: string
          ends_at: string
          id: string
          starts_at: string
          strategy_json: Json
          title: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          ends_at: string
          id?: string
          starts_at: string
          strategy_json?: Json
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          starts_at?: string
          strategy_json?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_strategies_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_media: {
        Row: {
          caption: string | null
          external_media_id: string
          id: string
          media_type: string | null
          permalink: string | null
          posted_at: string | null
          social_account_id: string
          synced_at: string
        }
        Insert: {
          caption?: string | null
          external_media_id: string
          id?: string
          media_type?: string | null
          permalink?: string | null
          posted_at?: string | null
          social_account_id: string
          synced_at?: string
        }
        Update: {
          caption?: string | null
          external_media_id?: string
          id?: string
          media_type?: string | null
          permalink?: string | null
          posted_at?: string | null
          social_account_id?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_media_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          payload: Json | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          payload?: Json | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          payload?: Json | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_metrics: {
        Row: {
          captured_at: string
          comments: number | null
          id: string
          impressions: number | null
          likes: number | null
          post_id: string
          profile_visits: number | null
          raw_metrics: Json | null
          reach: number | null
          saves: number | null
          shares: number | null
        }
        Insert: {
          captured_at?: string
          comments?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          post_id: string
          profile_visits?: number | null
          raw_metrics?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
        }
        Update: {
          captured_at?: string
          comments?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          post_id?: string
          profile_visits?: number | null
          raw_metrics?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_versions: {
        Row: {
          caption: string
          created_at: string
          created_by: Database["public"]["Enums"]["post_version_author"]
          creative_direction: string
          cta: string
          generation_prompt: string
          hashtags: Json
          headline: string
          id: string
          image_storage_path: string | null
          model_metadata: Json | null
          model_name: string | null
          post_id: string
          supporting_copy: string
          version_number: number
        }
        Insert: {
          caption?: string
          created_at?: string
          created_by?: Database["public"]["Enums"]["post_version_author"]
          creative_direction?: string
          cta?: string
          generation_prompt?: string
          hashtags?: Json
          headline?: string
          id?: string
          image_storage_path?: string | null
          model_metadata?: Json | null
          model_name?: string | null
          post_id: string
          supporting_copy?: string
          version_number: number
        }
        Update: {
          caption?: string
          created_at?: string
          created_by?: Database["public"]["Enums"]["post_version_author"]
          creative_direction?: string
          cta?: string
          generation_prompt?: string
          hashtags?: Json
          headline?: string
          id?: string
          image_storage_path?: string | null
          model_metadata?: Json | null
          model_name?: string | null
          post_id?: string
          supporting_copy?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_versions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          brand_id: string
          concept_title: string
          content_pillar: string
          created_at: string
          current_version_id: string | null
          id: string
          instagram_post_id: string | null
          objective: string
          published_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["post_status"]
          strategy_id: string | null
          ui_asset_required: boolean
          updated_at: string
          visual_format: Database["public"]["Enums"]["visual_format"] | null
        }
        Insert: {
          brand_id: string
          concept_title?: string
          content_pillar?: string
          created_at?: string
          current_version_id?: string | null
          id?: string
          instagram_post_id?: string | null
          objective?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          strategy_id?: string | null
          ui_asset_required?: boolean
          updated_at?: string
          visual_format?: Database["public"]["Enums"]["visual_format"] | null
        }
        Update: {
          brand_id?: string
          concept_title?: string
          content_pillar?: string
          created_at?: string
          current_version_id?: string | null
          id?: string
          instagram_post_id?: string | null
          objective?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          strategy_id?: string | null
          ui_asset_required?: boolean
          updated_at?: string
          visual_format?: Database["public"]["Enums"]["visual_format"] | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "post_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "content_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_jobs: {
        Row: {
          attempt_count: number
          created_at: string
          external_post_id: string | null
          id: string
          last_error: string | null
          post_id: string
          scheduled_at: string
          social_account_id: string
          status: Database["public"]["Enums"]["publication_job_status"]
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          external_post_id?: string | null
          id?: string
          last_error?: string | null
          post_id: string
          scheduled_at: string
          social_account_id: string
          status?: Database["public"]["Enums"]["publication_job_status"]
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          external_post_id?: string | null
          id?: string
          last_error?: string | null
          post_id?: string
          scheduled_at?: string
          social_account_id?: string
          status?: Database["public"]["Enums"]["publication_job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_jobs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publication_jobs_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          account_name: string
          biography: string | null
          brand_id: string
          created_at: string
          external_account_id: string
          followers_count: number | null
          id: string
          media_count: number | null
          platform: Database["public"]["Enums"]["social_platform"]
          profile_synced_at: string | null
          status: Database["public"]["Enums"]["social_account_status"]
          token_expires_at: string | null
          token_secret_ref: string
          updated_at: string
          website: string | null
        }
        Insert: {
          account_name: string
          biography?: string | null
          brand_id: string
          created_at?: string
          external_account_id: string
          followers_count?: number | null
          id?: string
          media_count?: number | null
          platform: Database["public"]["Enums"]["social_platform"]
          profile_synced_at?: string | null
          status?: Database["public"]["Enums"]["social_account_status"]
          token_expires_at?: string | null
          token_secret_ref: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_name?: string
          biography?: string | null
          brand_id?: string
          created_at?: string
          external_account_id?: string
          followers_count?: number | null
          id?: string
          media_count?: number | null
          platform?: Database["public"]["Enums"]["social_platform"]
          profile_synced_at?: string | null
          status?: Database["public"]["Enums"]["social_account_status"]
          token_expires_at?: string | null
          token_secret_ref?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ai_allowance: {
        Args: { p_brand_id: string }
        Returns: {
          allowed: boolean
          daily_limit: number
          daily_used: number
          hourly_limit: number
          hourly_used: number
          monthly_limit: number
          monthly_used: number
        }[]
      }
      read_provider_secret: { Args: { p_secret_id: string }; Returns: string }
      store_provider_secret: {
        Args: { p_name: string; p_secret: string }
        Returns: string
      }
    }
    Enums: {
      ai_provider: "GEMINI" | "IDEOGRAM"
      brand_asset_type:
        | "LOGO"
        | "PRODUCT_UI"
        | "PRODUCT_IMAGE"
        | "BADGE"
        | "LIFESTYLE"
        | "STYLE_REFERENCE"
      brand_status: "ACTIVE" | "ARCHIVED"
      generation_type:
        | "CONTENT_PLAN"
        | "POST_PROPOSAL"
        | "POST_REGENERATION"
        | "IMAGE"
        | "QA_REVIEW"
      notification_type:
        | "APPROVAL_REQUIRED"
        | "PUBLISH_SUCCEEDED"
        | "PUBLISH_FAILED"
      organization_role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER"
      post_status:
        | "DRAFT"
        | "GENERATING"
        | "READY"
        | "REVISION"
        | "APPROVED"
        | "SCHEDULED"
        | "PUBLISHING"
        | "PUBLISHED"
        | "FAILED"
        | "CANCELLED"
      post_version_author: "AI" | "USER"
      publication_job_status:
        | "PENDING"
        | "RUNNING"
        | "SUCCEEDED"
        | "FAILED"
        | "CANCELLED"
      social_account_status: "CONNECTED" | "EXPIRED" | "DISCONNECTED" | "ERROR"
      social_platform: "INSTAGRAM"
      visual_format:
        | "PRODUCT_UI"
        | "CINEMATIC_LIFESTYLE"
        | "RIDER_COMMUNITY"
        | "EDITORIAL_TYPOGRAPHY"
        | "DATA_VISUALIZATION"
        | "EDUCATIONAL_CAROUSEL"
        | "ACHIEVEMENT_BADGE"
        | "TEASER_LAUNCH"
        | "MANIFESTO"
        | "SEASONAL"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ai_provider: ["GEMINI", "IDEOGRAM"],
      brand_asset_type: [
        "LOGO",
        "PRODUCT_UI",
        "PRODUCT_IMAGE",
        "BADGE",
        "LIFESTYLE",
        "STYLE_REFERENCE",
      ],
      brand_status: ["ACTIVE", "ARCHIVED"],
      generation_type: [
        "CONTENT_PLAN",
        "POST_PROPOSAL",
        "POST_REGENERATION",
        "IMAGE",
        "QA_REVIEW",
      ],
      notification_type: [
        "APPROVAL_REQUIRED",
        "PUBLISH_SUCCEEDED",
        "PUBLISH_FAILED",
      ],
      organization_role: ["OWNER", "ADMIN", "EDITOR", "VIEWER"],
      post_status: [
        "DRAFT",
        "GENERATING",
        "READY",
        "REVISION",
        "APPROVED",
        "SCHEDULED",
        "PUBLISHING",
        "PUBLISHED",
        "FAILED",
        "CANCELLED",
      ],
      post_version_author: ["AI", "USER"],
      publication_job_status: [
        "PENDING",
        "RUNNING",
        "SUCCEEDED",
        "FAILED",
        "CANCELLED",
      ],
      social_account_status: ["CONNECTED", "EXPIRED", "DISCONNECTED", "ERROR"],
      social_platform: ["INSTAGRAM"],
      visual_format: [
        "PRODUCT_UI",
        "CINEMATIC_LIFESTYLE",
        "RIDER_COMMUNITY",
        "EDITORIAL_TYPOGRAPHY",
        "DATA_VISUALIZATION",
        "EDUCATIONAL_CAROUSEL",
        "ACHIEVEMENT_BADGE",
        "TEASER_LAUNCH",
        "MANIFESTO",
        "SEASONAL",
      ],
    },
  },
} as const
