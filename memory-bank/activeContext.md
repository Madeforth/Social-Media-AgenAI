# Active Context

## Current Phase
Milestone 3 complete and the Supabase project is live. The schema is applied, types are generated
from it and RLS is verified end to end. The screens still render empty states because the data
seam has not been wired to Supabase yet — that is Milestone 4.

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

## Supabase
Project `Apex Social AI`, ref `dxdbqikzbytenmdrkkgo`, region `eu-central-1`, PostgreSQL 17.
The repo is linked; `supabase/.temp/project-ref` holds the ref.

- All six migrations applied. 13 tables, all with RLS, 39 policies in `public` and 5 on
  `storage.objects`. Two private buckets.
- `npx supabase db advisors --linked --level warn` reports zero findings.
- Types are generated from the live schema into `packages/types/src/database.ts`. Regenerate with
  `npx supabase gen types typescript --linked` after every migration; the file is Prettier-ignored
  so regenerated output stays byte-comparable.
- Local credentials are in `apps/web/.env.local` and `apps/mobile/.env`, both gitignored. Clients
  use the `sb_publishable_...` key.
- There is no data in the project: zero users, zero rows, zero storage objects.

## Next Action — Milestone 4
Implement authentication and brand selection against Supabase by filling in the bodies of
`apps/web/src/lib/data.ts` and `apps/mobile/src/lib/data.ts`. No screen should need rewriting.

## Standing Rule — No Mock Data
CLAUDE.md principle 11: never add mock data of any kind, including temporarily. Screens read
through the data seam, which currently returns empty results, and every screen has a real loading,
empty and error state.

- No performance metric is invented. Analytics tiles and the dashboard performance panel render as
  unavailable until Instagram is connected.
- Dashboard counters are derived from the posts themselves, so a number can never disagree with
  what is on screen.
- The web shell states plainly that it is not connected to Supabase.

## Current Visual Reference
`assets/reference/ui-concept.png`
