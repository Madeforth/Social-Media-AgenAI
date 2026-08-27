# Active Context

## Current Phase
Milestone 2 written but not yet executed against a database. No product features implemented.

## What Exists Now
- npm workspaces monorepo: `apps/web`, `apps/mobile`, `packages/{config,types,ui,api,ai}`, `supabase/`.
- `apps/web`: Next.js 16 (App Router, Turbopack), React 19, Tailwind v4, dark theme wired to shared tokens.
- `apps/mobile`: Expo SDK 57, expo-router, Metro configured for the workspace.
- `packages/types`: `database.ts` holds row shapes; domain modules derive from it with narrowed
  jsonb types and compile-time enum-drift guards.
- `packages/ui`: design tokens in TypeScript plus a matching `tokens.css`.
- `packages/api`: Supabase client typed with `Database`, public keys only.
- `packages/ai`: Gemini model ids, prompt framework and structured-output schemas. No network code.
- `supabase/migrations/`: six migrations covering enums and helpers, organizations, brands,
  content, publishing and storage — all with RLS.

## Blocking Issue
The migrations have never been run. This machine has no Docker and no local PostgreSQL, so
`supabase start` cannot boot, and no Supabase project is provisioned. They were verified by
parsing only (libpg_query), which catches syntax errors but not semantic ones — a wrong column
reference inside a policy would still parse cleanly.

## Next Action
Provision a Supabase project, then:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase gen types typescript --linked > packages/types/src/database.ts
```

Diff the regenerated types against the hand-written file and reconcile any drift before building
UI on top of them.

## Then — Milestone 3
Implement the design system shell on mock data: web sidebar workspace and mobile bottom
navigation, per `docs/DESIGN_SYSTEM.md` and `docs/UI_SCREEN_MAP.md`.

## Current Visual Reference
`assets/reference/ui-concept.png`
