# Active Context

## Current Phase

Milestones 1–3 are closed and the Supabase project is live: the schema is applied, types are
generated from it, RLS is verified end to end, and the security work in front of the AI runtime is
in place. The screens still render empty states because the data seam has not been wired to
Supabase yet — that is Milestone 4.

## What Exists Now

- npm workspaces monorepo: `apps/web`, `apps/mobile`, `packages/{config,types,ui,api,ai}`,
  `supabase/`, `scripts/`.
- `apps/web`: Next.js 16 App Router. Sidebar workspace shell plus every V1 route — dashboard,
  Create with AI, calendar (month grid), content library with status filters, generated post
  detail, Brand Brain, assets, analytics, inbox and settings. Every route renders per request.
- `apps/mobile`: Expo SDK 57 with expo-router. Five bottom tabs (Home, Create, Calendar, Library,
  More) plus the immersive post review screen.
- `apps/*/src/lib/data.ts`: the only seam between screens and their data source. Every reader
  currently returns an empty result.
- `packages/types`: `database.ts` generated from the live schema, with derived domain types and
  enum-drift guards that fail the build if a runtime constant diverges from a database enum.
- `packages/ui`: design tokens (`tokens.ts` + `tokens.css`) and the shared status presentation map
  both apps render chips from.
- `packages/ai`: model ids, the prompt framework, structured-output schemas, and `safety.ts` —
  prompt-injection containment and model output validation, under 24 tests.
- `supabase/migrations/`: seven migrations, all applied.
- `scripts/`: `generate-database-types.mjs` and `check-client-bundle.mjs`.

## Supabase

Project `Apex Social AI`, ref `dxdbqikzbytenmdrkkgo`, region `eu-central-1`, PostgreSQL 17.
The repo is linked; `supabase/.temp/project-ref` holds the ref.

- All seven migrations applied. 13 tables in `public`, all with RLS, plus `ai_quotas`. 5 policies
  on `storage.objects`. Two private buckets.
- `npx supabase db advisors --linked --level warn` reports zero findings.
- Regenerate types with `npm run types:generate` after every migration. Do not pipe the CLI output
  into the file directly — that drops the header. The file is Prettier-ignored so regenerated
  output stays byte-comparable.
- Local credentials are in `apps/web/.env.local` and `apps/mobile/.env`, both gitignored. Clients
  use the `sb_publishable_...` key.
- The Auth admin API still requires the legacy `service_role` JWT; the new `sb_secret_...` key is
  rejected with "Invalid API key".
- There is no data in the project: zero users, zero rows, zero storage objects.

## Commands

```bash
npm run web              # Next.js dev server
npm run mobile           # Expo dev server
npm test                 # Vitest
npm run typecheck        # every workspace
npm run build            # every workspace with a build script
npm run verify:bundle    # scan the built client bundle for server-only values
npm run types:generate   # regenerate database types from the linked project
```

## Security Posture

See `docs/SECURITY.md`, which marks each control as enforced-and-verified or planned.

Enforced today: RLS on every table with no grants for `anon`; RLS helpers in a `private` schema
with no RPC surface; the provider token column not readable by clients; `ai_quotas` cost limits
enforced in the database and readable but not writable by clients; a nonce-based CSP plus the full
header set on the web app, which is why every route renders per request; `npm run verify:bundle`
proving no server-only value reaches the browser; prompt-injection containment and model output
validation in `packages/ai/src/safety.ts`.

Not yet addressed: the Edge Function gate (Milestone 6 — the required order of checks is written
down in `docs/SECURITY.md`), Meta webhook signature verification (Milestone 9), upload content
inspection, auth brute-force tuning, and recording which user approved a post. No penetration
testing has been done.

## Next Action — Milestone 4

Implement authentication and brand selection against Supabase by filling in the bodies of
`apps/web/src/lib/data.ts` and `apps/mobile/src/lib/data.ts`. No screen should need rewriting.

Two things to remember when writing those queries:

- `social_accounts` grants SELECT per column, so `select('*')` on that table is denied. Name the
  columns.
- Nothing in the app has ever rendered a populated list, because no data source has existed. The
  first real read is also the first test of every list, card and detail layout with content in it.

## Completed — Web and Mobile TR/EN i18n

Turkish/English localization is complete on both shipping clients. It is an unscheduled product
feature alongside the numbered milestones; Milestone 4 is still the next backend milestone.

Web:

- Every route lives under `apps/web/src/app/[locale]/`; Turkish is the default.
- `apps/web/src/proxy.ts` combines locale negotiation with the per-request CSP nonce. Unprefixed
  paths negotiate from `NEXT_LOCALE`, then `Accept-Language`, then Turkish. This is `proxy.ts`, not
  `middleware.ts`, because Next.js 16 renamed the convention.
- Every page, metadata title, shell label, empty state, status, visual/asset label and date is
  dictionary-driven. Internal links preserve `/tr` or `/en`, and the locale switcher preserves the
  current path and query string.
- A localized route-level 404 exists, while the global fallback is Turkish.

Mobile:

- `apps/mobile/src/i18n/` contains the typed dictionaries and React context used by every screen,
  tab label, status chip, visual label and date formatter.
- Initial locale comes from `expo-localization` (English only when the device reports English;
  otherwise Turkish). The user can switch language in More > Language, and AsyncStorage persists
  the selection across launches.
- The mobile locale is app state, not a route segment; all tabs and the current screen update
  immediately without navigation.

Verification:

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build --workspace @apex/web` and
  `npm run verify:bundle` pass.
- Expo production exports pass for both iOS and Android.
- Web TR/EN switching and locale-preserving navigation were exercised in Chrome against a
  production server. The mobile app was rendered through react-native-web; TR/EN switching and
  AsyncStorage persistence across a reload were exercised with no visible runtime failure.
- Native layout is still not verified on a physical device or simulator.

## Standing Rule — No Mock Data

CLAUDE.md principle 11: never add mock data of any kind, including temporarily. Screens read
through the data seam and every screen has a real loading, empty and error state.

- No performance metric is invented. Analytics tiles and the dashboard performance panel render as
  unavailable until Instagram is connected.
- Dashboard counters are derived from the posts themselves, so a number can never disagree with
  what is on screen.
- The web shell states plainly that it is not connected to Supabase.

## Current Visual Reference

`assets/reference/ui-concept.png`
