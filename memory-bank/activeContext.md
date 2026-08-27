# Active Context

## Current Phase
Milestone 3 complete — the design system shell is built on both surfaces. There is no data source
yet, so every screen renders its empty state.

## What Exists Now
- npm workspaces monorepo: `apps/web`, `apps/mobile`, `packages/{config,types,ui,api,ai}`,
  `supabase/`.
- `apps/web`: Next.js 16 App Router. Sidebar workspace shell plus every V1 route — dashboard,
  Create with AI, calendar (month grid), content library with status filters, generated post
  detail, Brand Brain, assets, analytics, inbox and settings.
- `apps/mobile`: Expo SDK 57 with expo-router. Five bottom tabs (Home, Create, Calendar, Library,
  More) plus the immersive post review screen.
- `packages/ui`: design tokens (`tokens.ts` + `tokens.css`) and the shared status presentation map
  both apps render chips from.
- `apps/*/src/lib/data.ts`: the only seam between screens and their data source. Every reader
  currently returns an empty result.
- `packages/types`: `database.ts` row shapes with derived domain types and enum-drift guards.
- `supabase/migrations/`: six migrations with RLS, still never executed.

## Blocking Issue
The migrations have never been run and no Supabase project is provisioned. This machine has no
Docker and no local PostgreSQL, so `supabase start` cannot boot. The migrations were verified by
parsing only, which catches syntax errors but not semantic ones.

## Next Action
Provision a Supabase project, then:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase gen types typescript --linked > packages/types/src/database.ts
```

Diff the regenerated types against the hand-written file and reconcile any drift.

## Then — Milestone 4
Implement authentication and brand selection against Supabase by filling in the bodies of
`apps/web/src/lib/data.ts` and `apps/mobile/src/lib/data.ts`. No screen should need rewriting.

## Standing Rule — No Mock Data
CLAUDE.md principle 11: never add mock data of any kind, including temporarily. A `@apex/mocks`
fixture package existed briefly during Milestone 3 and was removed. Screens read through the data
seam, which currently returns empty results, and every screen has a real empty state.

- No performance metric is invented. Analytics tiles and the dashboard performance panel render as
  unavailable until Instagram is connected.
- Dashboard counters are derived from the posts themselves, so a number can never disagree with
  what is on screen.
- The web shell states plainly that it is not connected to Supabase.

## Current Visual Reference
`assets/reference/ui-concept.png`
