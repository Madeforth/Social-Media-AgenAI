import type { AssertEqual } from './common';
import type { Enums, TableRow } from './database';

export type Organization = TableRow<'organizations'>;

export type OrganizationRole = Enums['organization_role'];

export type OrganizationMember = TableRow<'organization_members'>;

export type BrandStatus = Enums['brand_status'];

export type Brand = TableRow<'brands'>;

export interface ToneOfVoice {
  attributes: string[];
  do: string[];
  dont: string[];
}

export interface VisualRules {
  palette: string[];
  typography: string[];
  composition: string[];
  avoid: string[];
}

export interface CopyRules {
  language: string;
  reading_level: string;
  do: string[];
  dont: string[];
}

export interface ContentPillar {
  key: string;
  name: string;
  description: string;
  /** Share of the plan this pillar should occupy, 0–1. */
  target_share: number;
}

/**
 * The guidelines row with its jsonb columns narrowed to the shapes the product
 * actually writes. PostgreSQL only guarantees that the array columns are arrays.
 */
export type BrandGuidelines = Omit<
  TableRow<'brand_guidelines'>,
  'tone_of_voice' | 'visual_rules' | 'copy_rules' | 'forbidden_claims' | 'content_pillars'
> & {
  tone_of_voice: ToneOfVoice | null;
  visual_rules: VisualRules | null;
  copy_rules: CopyRules | null;
  forbidden_claims: string[];
  content_pillars: ContentPillar[];
};

/**
 * `PRODUCT_UI` assets are trusted screenshots: Gemini may place them inside a
 * composition but must never redraw or invent product UI.
 */
export const BRAND_ASSET_TYPES = [
  'LOGO',
  'PRODUCT_UI',
  'PRODUCT_IMAGE',
  'BADGE',
  'LIFESTYLE',
  'STYLE_REFERENCE',
] as const;

export type BrandAssetType = Enums['brand_asset_type'];

export const BRAND_ASSET_TYPE_ENUM_MATCHES: AssertEqual<
  BrandAssetType,
  (typeof BRAND_ASSET_TYPES)[number]
> = true;

export type BrandAsset = Omit<TableRow<'brand_assets'>, 'metadata'> & {
  metadata: Record<string, unknown> | null;
};
