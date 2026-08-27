/**
 * Database contract for the `public` schema.
 *
 * This file is hand-maintained until a Supabase project is provisioned. Once it
 * is, regenerate it and diff the result:
 *
 * ```bash
 * npx supabase gen types typescript --local > packages/types/src/database.ts
 * ```
 *
 * Domain types in the sibling modules are derived from these rows, so this file
 * is the single place where column shapes are described.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          owner_user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          organization_id: string;
          user_id: string;
          role: Database['public']['Enums']['organization_role'];
          created_at: string;
        };
        Insert: {
          organization_id: string;
          user_id: string;
          role?: Database['public']['Enums']['organization_role'];
          created_at?: string;
        };
        Update: {
          organization_id?: string;
          user_id?: string;
          role?: Database['public']['Enums']['organization_role'];
          created_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          description: string | null;
          status: Database['public']['Enums']['brand_status'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          description?: string | null;
          status?: Database['public']['Enums']['brand_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          status?: Database['public']['Enums']['brand_status'];
          created_at?: string;
          updated_at?: string;
        };
      };
      brand_guidelines: {
        Row: {
          id: string;
          brand_id: string;
          mission: string | null;
          vision: string | null;
          positioning: string | null;
          target_audience: string | null;
          tone_of_voice: Json | null;
          visual_rules: Json | null;
          copy_rules: Json | null;
          forbidden_claims: Json;
          content_pillars: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          mission?: string | null;
          vision?: string | null;
          positioning?: string | null;
          target_audience?: string | null;
          tone_of_voice?: Json | null;
          visual_rules?: Json | null;
          copy_rules?: Json | null;
          forbidden_claims?: Json;
          content_pillars?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          mission?: string | null;
          vision?: string | null;
          positioning?: string | null;
          target_audience?: string | null;
          tone_of_voice?: Json | null;
          visual_rules?: Json | null;
          copy_rules?: Json | null;
          forbidden_claims?: Json;
          content_pillars?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      brand_assets: {
        Row: {
          id: string;
          brand_id: string;
          asset_type: Database['public']['Enums']['brand_asset_type'];
          name: string;
          storage_path: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          asset_type: Database['public']['Enums']['brand_asset_type'];
          name: string;
          storage_path: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          asset_type?: Database['public']['Enums']['brand_asset_type'];
          name?: string;
          storage_path?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      content_strategies: {
        Row: {
          id: string;
          brand_id: string;
          title: string;
          strategy_json: Json;
          starts_at: string;
          ends_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          title: string;
          strategy_json?: Json;
          starts_at: string;
          ends_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          title?: string;
          strategy_json?: Json;
          starts_at?: string;
          ends_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          brand_id: string;
          strategy_id: string | null;
          status: Database['public']['Enums']['post_status'];
          content_pillar: string;
          objective: string;
          concept_title: string;
          visual_format: Database['public']['Enums']['visual_format'] | null;
          ui_asset_required: boolean;
          current_version_id: string | null;
          scheduled_at: string | null;
          published_at: string | null;
          instagram_post_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          strategy_id?: string | null;
          status?: Database['public']['Enums']['post_status'];
          content_pillar?: string;
          objective?: string;
          concept_title?: string;
          visual_format?: Database['public']['Enums']['visual_format'] | null;
          ui_asset_required?: boolean;
          current_version_id?: string | null;
          scheduled_at?: string | null;
          published_at?: string | null;
          instagram_post_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          strategy_id?: string | null;
          status?: Database['public']['Enums']['post_status'];
          content_pillar?: string;
          objective?: string;
          concept_title?: string;
          visual_format?: Database['public']['Enums']['visual_format'] | null;
          ui_asset_required?: boolean;
          current_version_id?: string | null;
          scheduled_at?: string | null;
          published_at?: string | null;
          instagram_post_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_versions: {
        Row: {
          id: string;
          post_id: string;
          version_number: number;
          headline: string;
          supporting_copy: string;
          caption: string;
          cta: string;
          hashtags: Json;
          creative_direction: string;
          generation_prompt: string;
          image_storage_path: string | null;
          created_by: Database['public']['Enums']['post_version_author'];
          model_name: string | null;
          model_metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          version_number: number;
          headline?: string;
          supporting_copy?: string;
          caption?: string;
          cta?: string;
          hashtags?: Json;
          creative_direction?: string;
          generation_prompt?: string;
          image_storage_path?: string | null;
          created_by?: Database['public']['Enums']['post_version_author'];
          model_name?: string | null;
          model_metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          version_number?: number;
          headline?: string;
          supporting_copy?: string;
          caption?: string;
          cta?: string;
          hashtags?: Json;
          creative_direction?: string;
          generation_prompt?: string;
          image_storage_path?: string | null;
          created_by?: Database['public']['Enums']['post_version_author'];
          model_name?: string | null;
          model_metadata?: Json | null;
          created_at?: string;
        };
      };
      ai_generations: {
        Row: {
          id: string;
          brand_id: string;
          post_id: string | null;
          generation_type: Database['public']['Enums']['generation_type'];
          provider: string;
          model: string;
          input_json: Json;
          output_json: Json | null;
          estimated_cost: number | null;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          post_id?: string | null;
          generation_type: Database['public']['Enums']['generation_type'];
          provider: string;
          model: string;
          input_json?: Json;
          output_json?: Json | null;
          estimated_cost?: number | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          post_id?: string | null;
          generation_type?: Database['public']['Enums']['generation_type'];
          provider?: string;
          model?: string;
          input_json?: Json;
          output_json?: Json | null;
          estimated_cost?: number | null;
          duration_ms?: number | null;
          created_at?: string;
        };
      };
      social_accounts: {
        Row: {
          id: string;
          brand_id: string;
          platform: Database['public']['Enums']['social_platform'];
          account_name: string;
          external_account_id: string;
          /** Not selectable by `authenticated`; server-side use only. */
          token_secret_ref: string;
          status: Database['public']['Enums']['social_account_status'];
          token_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          platform: Database['public']['Enums']['social_platform'];
          account_name: string;
          external_account_id: string;
          token_secret_ref: string;
          status?: Database['public']['Enums']['social_account_status'];
          token_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          platform?: Database['public']['Enums']['social_platform'];
          account_name?: string;
          external_account_id?: string;
          token_secret_ref?: string;
          status?: Database['public']['Enums']['social_account_status'];
          token_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      publication_jobs: {
        Row: {
          id: string;
          post_id: string;
          social_account_id: string;
          status: Database['public']['Enums']['publication_job_status'];
          scheduled_at: string;
          attempt_count: number;
          last_error: string | null;
          external_post_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          social_account_id: string;
          status?: Database['public']['Enums']['publication_job_status'];
          scheduled_at: string;
          attempt_count?: number;
          last_error?: string | null;
          external_post_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          social_account_id?: string;
          status?: Database['public']['Enums']['publication_job_status'];
          scheduled_at?: string;
          attempt_count?: number;
          last_error?: string | null;
          external_post_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_metrics: {
        Row: {
          id: string;
          post_id: string;
          captured_at: string;
          impressions: number | null;
          reach: number | null;
          likes: number | null;
          comments: number | null;
          saves: number | null;
          shares: number | null;
          profile_visits: number | null;
          raw_metrics: Json | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          captured_at?: string;
          impressions?: number | null;
          reach?: number | null;
          likes?: number | null;
          comments?: number | null;
          saves?: number | null;
          shares?: number | null;
          profile_visits?: number | null;
          raw_metrics?: Json | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          captured_at?: string;
          impressions?: number | null;
          reach?: number | null;
          likes?: number | null;
          comments?: number | null;
          saves?: number | null;
          shares?: number | null;
          profile_visits?: number | null;
          raw_metrics?: Json | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: Database['public']['Enums']['notification_type'];
          title: string;
          body: string;
          read_at: string | null;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: Database['public']['Enums']['notification_type'];
          title: string;
          body?: string;
          read_at?: string | null;
          payload?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: Database['public']['Enums']['notification_type'];
          title?: string;
          body?: string;
          read_at?: string | null;
          payload?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_organization_member: {
        Args: { p_organization_id: string };
        Returns: boolean;
      };
      has_organization_role: {
        Args: {
          p_organization_id: string;
          p_roles: Database['public']['Enums']['organization_role'][];
        };
        Returns: boolean;
      };
      can_read_brand: { Args: { p_brand_id: string }; Returns: boolean };
      can_write_brand: { Args: { p_brand_id: string }; Returns: boolean };
      can_administer_brand: { Args: { p_brand_id: string }; Returns: boolean };
    };
    Enums: {
      organization_role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
      brand_status: 'ACTIVE' | 'ARCHIVED';
      brand_asset_type:
        'LOGO' | 'PRODUCT_UI' | 'PRODUCT_IMAGE' | 'BADGE' | 'LIFESTYLE' | 'STYLE_REFERENCE';
      post_status:
        | 'DRAFT'
        | 'GENERATING'
        | 'READY'
        | 'REVISION'
        | 'APPROVED'
        | 'SCHEDULED'
        | 'PUBLISHING'
        | 'PUBLISHED'
        | 'FAILED'
        | 'CANCELLED';
      visual_format:
        | 'PRODUCT_UI'
        | 'CINEMATIC_LIFESTYLE'
        | 'RIDER_COMMUNITY'
        | 'EDITORIAL_TYPOGRAPHY'
        | 'DATA_VISUALIZATION'
        | 'EDUCATIONAL_CAROUSEL'
        | 'ACHIEVEMENT_BADGE'
        | 'TEASER_LAUNCH'
        | 'MANIFESTO'
        | 'SEASONAL';
      post_version_author: 'AI' | 'USER';
      generation_type:
        'CONTENT_PLAN' | 'POST_PROPOSAL' | 'POST_REGENERATION' | 'IMAGE' | 'QA_REVIEW';
      social_platform: 'INSTAGRAM';
      social_account_status: 'CONNECTED' | 'EXPIRED' | 'DISCONNECTED' | 'ERROR';
      publication_job_status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
      notification_type: 'APPROVAL_REQUIRED' | 'PUBLISH_SUCCEEDED' | 'PUBLISH_FAILED';
    };
    CompositeTypes: Record<never, never>;
  };
}

/** Convenience aliases so domain modules do not repeat the deep index chain. */
export type Tables = Database['public']['Tables'];
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update'];
export type Enums = Database['public']['Enums'];
