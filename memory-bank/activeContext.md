# Active Context

## Current Phase
Milestone 3 complete — the design system shell is built on both surfaces, running on fixtures.
Nothing is connected to a backend yet.

## What Exists Now
- npm workspaces monorepo: `apps/web`, `apps/mobile`, `packages/{config,types,ui,api,ai,mocks}`,
  `supabase/`.
- `apps/web`: Next.js 16 App Router. Sidebar workspace shell plus every V1 route — dashboard,
  Create with AI, calendar (month grid), content library with status filters, generated post
  detail, Brand Brain, assets, analytics, inbox and settings.
- `apps/mobile`: Expo SDK 57 with expo-router. Five bottom tabs (Home, Create, Calendar, Library,
  More) plus the immersive post review screen.
- `packages/ui`: design tokens (`tokens.ts` + `tokens.css`) and the shared status presentation map
  both apps render chips from.
- `packages/mocks`: deterministic fixtures, dated from `MOCK_NOW`, shared by web and mobile.
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
Implement authentication and brand selection against Supabase, replacing `@apex/mocks` reads
screen by screen. The package is designed to be deleted once that is done.

## Honesty Constraints Held So Far
- No fabricated performance metrics anywhere. Analytics tiles and the dashboard performance panel
  render as unavailable until Instagram is connected.
- Dashboard counters are counted from the fixtures, so every number corresponds to a visible post.
- The web shell carries a visible "Demo data" label; mobile carries the same badge on Home.
- Brand Brain fields are deliberately empty, because inventing a mission statement would put words
  in the brand's mouth.

## Current Visual Reference
`assets/reference/ui-concept.png`
