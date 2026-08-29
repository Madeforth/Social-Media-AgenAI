/** JSON Schema passed to Gemini as a structured-output constraint for a CreativePlan. */
export const CREATIVE_PLAN_SCHEMA = {
  type: 'object',
  properties: {
    schemaVersion: { type: 'string', enum: ['2.0'] },
    singleIdea: { type: 'string' },
    objective: { type: 'string' },
    audienceId: { type: 'string' },
    contentPillarId: { type: 'string' },
    format: { type: 'string', enum: ['instagram-square', 'instagram-portrait', 'story-reel-cover', 'landscape-social'] },
    layoutRecipe: {
      type: 'string',
      enum: ['editorial-hero-left', 'feature-device-right', 'metric-poster', 'minimal-announcement'],
    },
    factIdsUsed: { type: 'array', items: { type: 'string' } },
    copy: {
      type: 'object',
      properties: {
        eyebrow: { type: 'string' },
        headline: { type: 'string' },
        body: { type: 'string' },
        cta: { type: 'string' },
        metric: { type: 'string' },
        metricLabel: { type: 'string' },
      },
      required: ['eyebrow', 'headline', 'body', 'cta'],
    },
    scene: {
      type: 'object',
      properties: {
        high_level_description: { type: 'string' },
        compositional_deconstruction: {
          type: 'object',
          properties: {
            background: { type: 'string' },
            elements: {
              type: 'array',
              maxItems: 5,
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['obj'] },
                  desc: { type: 'string' },
                  bbox: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'integer', minimum: 0, maximum: 1000 } },
                },
                required: ['type', 'desc'],
              },
            },
          },
          required: ['background', 'elements'],
        },
        style_description: {
          type: 'object',
          properties: {
            aesthetics: { type: 'string' },
            lighting: { type: 'string' },
            photo: { type: 'string' },
            medium: { type: 'string' },
            color_palette: { type: 'array', minItems: 3, maxItems: 8, items: { type: 'string' } },
          },
          required: ['aesthetics', 'lighting', 'medium', 'color_palette'],
        },
      },
      required: ['high_level_description', 'compositional_deconstruction', 'style_description'],
    },
    sceneNegativePrompt: { type: 'string' },
    sceneFocus: {
      type: 'object',
      properties: {
        subjectSide: { type: 'string', enum: ['left', 'right', 'center'] },
        copySafeSide: { type: 'string', enum: ['left', 'right', 'top', 'bottom', 'center'] },
        copySafeAreaPercent: { type: 'integer', minimum: 30, maximum: 70 },
      },
      required: ['subjectSide', 'copySafeSide', 'copySafeAreaPercent'],
    },
    assetUse: {
      type: 'object',
      properties: {
        logo: { type: 'string', enum: ['EXACT_ASSET'] },
        productUi: { type: 'string', enum: ['NONE', 'EXACT_ASSET'] },
        styleReferences: { type: 'string', enum: ['NONE', 'V3_REFERENCE'] },
      },
      required: ['logo', 'productUi', 'styleReferences'],
    },
    accent: { type: 'string', enum: ['cyan', 'orange', 'none'] },
    rationale: { type: 'string' },
    qaTargets: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'schemaVersion', 'singleIdea', 'objective', 'audienceId', 'contentPillarId', 'format',
    'layoutRecipe', 'factIdsUsed', 'copy', 'scene', 'sceneNegativePrompt', 'sceneFocus',
    'assetUse', 'accent', 'rationale', 'qaTargets',
  ],
} as const;

/** JSON Schema passed to Gemini Vision as a structured-output constraint for the visual critic. */
export const VISUAL_QA_SCHEMA = {
  type: 'object',
  properties: {
    schemaVersion: { type: 'string', enum: ['1.0'] },
    hardFails: { type: 'array', items: { type: 'string' } },
    scores: {
      type: 'object',
      properties: {
        brandFidelity: { type: 'integer', minimum: 0, maximum: 100 },
        hierarchy: { type: 'integer', minimum: 0, maximum: 100 },
        legibility: { type: 'integer', minimum: 0, maximum: 100 },
        composition: { type: 'integer', minimum: 0, maximum: 100 },
        premiumFeel: { type: 'integer', minimum: 0, maximum: 100 },
        sceneIntegrity: { type: 'integer', minimum: 0, maximum: 100 },
        platformReadiness: { type: 'integer', minimum: 0, maximum: 100 },
      },
      required: ['brandFidelity', 'hierarchy', 'legibility', 'composition', 'premiumFeel', 'sceneIntegrity', 'platformReadiness'],
    },
    overall: { type: 'integer', minimum: 0, maximum: 100 },
    fixes: { type: 'array', items: { type: 'string' } },
    verdict: { type: 'string', enum: ['PASS', 'REPAIR', 'REJECT'] },
  },
  required: ['schemaVersion', 'hardFails', 'scores', 'overall', 'fixes', 'verdict'],
} as const;
