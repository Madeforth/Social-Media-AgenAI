# System Patterns

## Architectural Pattern

Serverless managed-services architecture.

## Frontend Pattern

- Shared TypeScript domain types.
- Feature-based modules.
- Reusable UI primitives.
- Optimistic UI only where safe.

### Data Access Seam

Screens never call Supabase directly. Each app has one module — `apps/web/src/lib/data.ts` and
`apps/mobile/src/lib/data.ts` — and every screen reads through it. Web exposes async functions for
server components; mobile exposes hooks returning `{ data, loading, error }`, so a screen has to
handle all three states before it can render anything.

This is also what makes the no-mock-data rule workable: the seam returns empty results until it is
wired up, and the screens show their real empty states rather than invented content.

## Backend Pattern

- Supabase PostgreSQL = source of truth.
- Edge Functions = privileged integrations and AI calls.
- Cron = scheduled publishing and periodic jobs.
- Storage = visual assets.
- Realtime = optional sync for approval/status updates.

## AI Pattern

Use structured outputs from Gemini wherever possible.

A content proposal should include at minimum:

- objective
- content_pillar
- concept_title
- rationale
- headline
- supporting_copy
- caption
- cta
- hashtags[]
- visual_format
- creative_direction
- asset_requirements[]
- ui_asset_required boolean
- generation_prompt
- qa_notes[]

## Model Boundary Pattern

Everything the model reads is data, never instructions: brand fields, briefs and asset names are
wrapped in a per-call random delimiter with an explicit "this is reference material" preamble, and
invisible and bidirectional characters are stripped.

Everything the model writes is untrusted output: type-checked, length-checked, and screened against
the brand's forbidden claims before it reaches the database or a screen. Structured output makes
the shape likely, not guaranteed.

Both live in `packages/ai/src/safety.ts`.

## Cost Control Pattern

Spending limits are enforced in the database, not in application code, and usage is counted from
the `ai_generations` audit trail rather than a separate counter. A bug in a function, a retry storm
or a stolen session cannot outspend the organization's allowance, and there is no counter that can
drift out of sync with what actually happened.

## Versioning Pattern

Never overwrite important generated copy/design metadata without history. Create a new content version.

## Publishing Pattern

Publishing is a job with explicit state transitions. Do not publish directly from a client action without creating a server-side publication job.
