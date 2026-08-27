# System Patterns

## Architectural Pattern

Serverless managed-services architecture.

## Frontend Pattern

- Shared TypeScript domain types.
- Feature-based modules.
- Reusable UI primitives.
- Server state fetched through typed API clients.
- Optimistic UI only where safe.

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

## Versioning Pattern

Never overwrite important generated copy/design metadata without history. Create a new content version.

## Publishing Pattern

Publishing is a job with explicit state transitions. Do not publish directly from a client action without creating a server-side publication job.
