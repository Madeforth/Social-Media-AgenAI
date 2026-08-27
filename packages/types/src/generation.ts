import type { AssertEqual } from './common';
import type { Enums, TableRow } from './database';
import type { VisualFormat } from './post';

/**
 * The structured proposal Gemini must return for every content generation.
 * Mirrors the AI pattern in `memory-bank/systemPatterns.md`.
 */
export interface ContentProposal {
  objective: string;
  content_pillar: string;
  concept_title: string;
  rationale: string;
  headline: string;
  supporting_copy: string;
  caption: string;
  cta: string;
  hashtags: string[];
  visual_format: VisualFormat;
  creative_direction: string;
  asset_requirements: AssetRequirement[];
  ui_asset_required: boolean;
  generation_prompt: string;
  qa_notes: string[];
}

export interface AssetRequirement {
  asset_type: string;
  description: string;
  required: boolean;
}

/** Result of the self-QA pass run before a post reaches human review. */
export interface QaResult {
  passed: boolean;
  checks: QaCheck[];
}

export interface QaCheck {
  name: string;
  passed: boolean;
  note: string;
}

export const GENERATION_TYPES = [
  'CONTENT_PLAN',
  'POST_PROPOSAL',
  'POST_REGENERATION',
  'IMAGE',
  'QA_REVIEW',
] as const;

export type GenerationType = Enums['generation_type'];

export const GENERATION_TYPE_ENUM_MATCHES: AssertEqual<
  GenerationType,
  (typeof GENERATION_TYPES)[number]
> = true;

/** Audit row for every AI call. Prompts and outputs are stored, never discarded. */
export type AiGeneration = Omit<TableRow<'ai_generations'>, 'input_json' | 'output_json'> & {
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown> | null;
};

export type ContentStrategy = Omit<TableRow<'content_strategies'>, 'strategy_json'> & {
  strategy_json: Record<string, unknown>;
};
