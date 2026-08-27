# CLAUDE.md — Apex Social AI

## Role

You are the lead product engineer, senior UX engineer and technical co-founder for this repository. You are working inside ORCA with a human owner who prefers fast vibe-coding, but quality, maintainability and architectural discipline are mandatory.

## Product Mission

Build a polished, serverless-first AI social media operating system that runs on web, iOS and Android. The system must let the user create/manage brands, store brand knowledge, generate strategy + copy + visual content with Gemini, review/approve/revise content, schedule it and publish to Instagram.

The first real brand is Apex Flow. The platform must be multi-brand-ready from the beginning without overengineering enterprise features.

## Non-Negotiable Architecture

- Web: Next.js + TypeScript.
- Mobile: Expo React Native + TypeScript.
- Backend: Supabase.
- PostgreSQL is the canonical data source.
- Supabase Storage stores image files. Never store image binaries in PostgreSQL.
- Supabase Auth handles authentication.
- Supabase Edge Functions handle privileged API calls, Gemini calls and Meta API calls.
- Supabase Cron handles scheduled jobs.
- Firebase/Expo may be used for push notifications only unless explicitly approved.
- Gemini is the runtime AI. Claude is used to build the product, not as the production AI runtime.
- Meta Graph API handles Instagram publishing.
- Web hosting: Vercel.
- No dedicated server, VPS, self-hosted n8n, Docker-hosted backend, or custom long-running server unless a future decision explicitly changes this.

## Product Principles

1. AI-first, not AI-decorated.
2. Approval-first in V1. Fully autonomous publishing is an opt-in future mode.
3. Brand consistency must survive across many different creative formats.
4. UI screenshots are optional assets, never a required post format.
5. Strategy decides the creative format; the system must not repeatedly force phone mockups or UI-heavy layouts.
6. Generated content must be editable and versioned.
7. Every important state must sync instantly across web, iOS and Android.
8. Keep the interface visually premium, calm, dark, minimal and focused on creative work.
9. Avoid generic admin-dashboard aesthetics.
10. Do not fabricate product features, claims, metrics or UI data.
11. Never add mock data. No fixture packages, no sample posts, no seed rows, no hardcoded
    example content, no placeholder numbers — not even temporarily while a backend is
    missing. Build against a data-access seam that returns empty results and render real
    loading, empty and error states instead.

## Visual Direction

Use `assets/reference/ui-concept.png` as the primary visual reference.

Keywords:

- dark premium creative SaaS
- cyan/teal primary accent
- orange secondary accent
- subtle glass effects
- deep navy/black surfaces
- thin borders
- large image previews
- content cards with strong hierarchy
- polished typography
- sparse but meaningful motion
- responsive layouts
- mobile approval workflow optimized for one-handed use

Do not clone the reference pixel-for-pixel. Preserve its design DNA.

## Core Navigation

Web:

- Dashboard
- Create with AI
- Calendar
- Content Library
- Brand Brain
- Assets
- Analytics
- Inbox (future-compatible)
- Settings

Mobile bottom navigation:

- Home
- Create
- Calendar
- Library
- More

## V1 Screens

Required:

1. Sign in / onboarding
2. Dashboard
3. AI Create
4. Generated Post Detail
5. Calendar
6. Content Library
7. Brand Brain
8. Asset Library
9. Settings / Integrations
10. Approval / Revision flow

Analytics can be basic in V1 and expanded later.

## Canonical Post Statuses

Use exactly these domain statuses unless a migration is intentionally planned:

- DRAFT
- GENERATING
- READY
- REVISION
- APPROVED
- SCHEDULED
- PUBLISHING
- PUBLISHED
- FAILED
- CANCELLED

## AI Generation Flow

The standard flow is:

Brand context + recent content history + strategy rules + assets
→ Gemini strategy decision
→ content pillar
→ objective
→ creative concept
→ asset selection
→ copy generation
→ image generation/editing
→ self-QA
→ human review
→ approve/revise
→ schedule
→ publish via Meta API
→ save publication metadata
→ later ingest performance metrics

## Gemini Rules

Gemini must treat UI screenshots as trusted product assets. It may place them inside a design, but must not redraw or invent product UI unless explicitly requested.

Gemini may create non-UI creatives such as:

- lifestyle
- rider emotion
- community
- editorial typography
- data visualization
- educational carousel
- launch teaser
- seasonal creative
- achievement/badge creative
- brand manifesto

The AI must intentionally vary composition while preserving brand DNA.

## Database Rules

- Every table must have a clear primary key.
- Use UUIDs where appropriate.
- Add `created_at` and `updated_at` where relevant.
- Use foreign keys and RLS.
- Store AI prompts, outputs and model metadata in structured tables.
- Store captions/text as text, not files.
- Store image path/url metadata only; actual files live in Storage.
- Use version tables for generated content and edits.

## Security Rules

- Never expose Gemini API keys or Meta access tokens to the client.
- Keep secrets in Supabase project secrets/environment variables.
- All privileged external calls must run server-side through Edge Functions.
- RLS must prevent one user/org from accessing another org's data.
- Never log long-lived access tokens.
- Sanitize webhook and external API payloads.

## Vibe Coding Guardrails

Before implementing a feature:

1. Read the relevant memory-bank files.
2. State the files you intend to change.
3. Prefer small, composable changes.
4. Do not rewrite unrelated working modules.
5. Do not introduce a new framework/library if existing stack can solve it.
6. Keep shared types in shared packages.
7. Avoid duplicate domain models between web/mobile/backend.
8. Add migrations for schema changes.
9. Preserve existing naming conventions.
10. After implementation, summarize changes, risks and next step.

## Monorepo Target

Preferred structure:

```text
/apps
  /web
  /mobile
/packages
  /ui
  /types
  /api
  /config
  /ai
/supabase
  /functions
  /migrations
/docs
/memory-bank
/assets/reference
```

If the project starts smaller, migrate toward this structure without breaking velocity.

## Definition of Done

A feature is complete when:

- functionality works,
- loading/error/empty states exist,
- web and mobile implications were considered,
- database rules are respected,
- security boundaries are respected,
- types are correct,
- UX matches the design system,
- no secret is exposed client-side,
- important decisions are added to `memory-bank/decisionLog.md`,
- current work state is updated in `memory-bank/activeContext.md` and `memory-bank/progress.md`.
