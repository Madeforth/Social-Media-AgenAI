import { VISUAL_FORMATS } from '@apex/types';

/**
 * JSON schema passed to Gemini as a structured-output constraint for a content
 * proposal. Shape matches `ContentProposal` in `@apex/types`.
 */
export const CONTENT_PROPOSAL_SCHEMA = {
  type: 'object',
  properties: {
    objective: { type: 'string' },
    content_pillar: { type: 'string' },
    concept_title: { type: 'string' },
    rationale: { type: 'string' },
    headline: { type: 'string' },
    supporting_copy: { type: 'string' },
    caption: { type: 'string' },
    cta: { type: 'string' },
    hashtags: { type: 'array', items: { type: 'string' } },
    visual_format: { type: 'string', enum: [...VISUAL_FORMATS] },
    creative_direction: { type: 'string' },
    asset_requirements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          asset_type: { type: 'string' },
          description: { type: 'string' },
          required: { type: 'boolean' },
        },
        required: ['asset_type', 'description', 'required'],
      },
    },
    ui_asset_required: { type: 'boolean' },
    generation_prompt: { type: 'string' },
    qa_notes: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'objective',
    'content_pillar',
    'concept_title',
    'rationale',
    'headline',
    'supporting_copy',
    'caption',
    'cta',
    'hashtags',
    'visual_format',
    'creative_direction',
    'asset_requirements',
    'ui_asset_required',
    'generation_prompt',
    'qa_notes',
  ],
} as const;

/** Structured-output schema for the self-QA pass. */
export const QA_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    passed: { type: 'boolean' },
    checks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          passed: { type: 'boolean' },
          note: { type: 'string' },
        },
        required: ['name', 'passed', 'note'],
      },
    },
  },
  required: ['passed', 'checks'],
} as const;
