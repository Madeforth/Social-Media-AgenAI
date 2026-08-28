# Active Context

## Current Phase

All nine numbered milestones are closed, plus basic analytics, notifications, and (as of
2026-08-28 daytime, a separate session working with real provider credentials) the AI/publishing
path has now actually been exercised end to end and hardened against what real calls exposed.
Mobile was brought to parity with web in the overnight session; the daytime session's provider
work landed on web only (Settings' AI-provider UI, prompt/model fixes) — check whether mobile's
generate/image calls need the same fixes before assuming parity still holds.

What the daytime session (commits `83b2b74`..`fbe6f33`, all `Co-Authored-By: Claude Opus 5`) found
and fixed, working against live Gemini and Ideogram keys:

- The pinned Gemini model constants (`gemini-2.5-pro`/`-flash`) were retired by Google — generation
  was dead on arrival until this was caught via the `ai_generations` audit row. Fixed by making
  model choice per-connection instead of a compiled-in default (see below).
- `ai_provider_keys` became a real multi-provider system: an organization can hold up to five named
  connections (DB-trigger-enforced), a separate routing table decides which connection writes text
  and which draws images, and `connect-gemini`/`gemini-models` were deleted in favor of one
  `ai-providers` Edge Function. Settings has model-choice dropdowns per connection.
- The image prompt was being wrapped in `renderUntrusted` (the text-model containment scheme) —
  wrong for a model that draws the words it's handed rather than reading instructions, so it drew
  the boundary markers and preamble as visible poster text. Removed for images.
- Generated images now pin `imageConfig.aspectRatio: "4:5"` (was defaulting to landscape and
  getting cropped by the preview) and the preview switched to `object-contain`.
- Output validation was rejecting entire valid proposals over recoverable defects — a hashtag
  missing its `#`, a field a few characters over its limit. Both are now repaired in place and
  recorded as an adjustment (visible in `qa_notes`) rather than discarding the whole generation
  (which still burned a quota call). Field length limits themselves were also wrong (one shared
  120-char ceiling across three differently-shaped fields).
- Provider error messages were being swallowed behind a generic translated string at every layer
  (server action → page). The provider's actual message (a 402 "add a payment method", a 404
  "model no longer available", a validation error) now renders under the generic banner.
- Every slow action (generate, regenerate, generate image, publish, sync metrics, approve, request
  revision, the three verify-then-save Settings forms) now shows a real pending state: button
  swaps label + spinner + disables, plus an indeterminate progress bar with a live seconds counter
  — was previously fully inert for the 7-20s a real call takes, which invited double-submits.
  New shared components: `apps/web/src/components/ui/{pending-bar,submit-button}.tsx`.
- Instagram: a **Disconnect** button now exists (Settings kept no way to replace a token before
  this); a `delete_provider_secret` RPC was added so disconnecting also removes the Vault secret,
  not just the row; every Graph API call path now detects an auth failure (Meta reports expiry,
  revocation, and app removal identically as `OAuthException 190`) and marks the account `EXPIRED`
  rather than continuing to claim it's connected; a **Read profile** action pulls the account's
  bio/recent captions into brand context for generation (new `sync-instagram-profile` function),
  since Brand Brain alone was too thin and the model was guessing from the brand name.
- `brands.app_url` is new (Settings, validated three times — DB check constraint, server action,
  Edge Function — against `javascript:`/`data:` before it enters a prompt) — captions now end with
  it verbatim when set, and are told explicitly not to invent a link when it isn't.
- Caption structure and the image "designer's brief" were rewritten following Google's own
  prompt-design guidance (few-shot example, headings as delimiters, hook/value/close shape,
  emoji constrained to line starts) after live output showed dense unstructured paragraphs and
  photographs where graphic-design posters were wanted. A design-led layout may now also carry a
  photograph inside it (subject/region/blend/type-legibility all specified), preferred over a bare
  photo when the asset library is empty.

## Next Action

Nothing is scoped and unbuilt in the numbered-milestone sense. Live paths:

1. Keep exercising the AI/publishing loop for real and fixing whatever the next live call exposes
   — the pattern above (audit row → real error → prompt/validation/UI fix) is the working method,
   not a one-time cleanup.
2. Check whether `apps/mobile`'s generate/image/connect calls need the same fixes the daytime
   session made on web (same Edge Functions, so the backend fixes apply automatically, but any
   web-only UI change — pending states, error detail surfacing, the app_url field, Disconnect,
   Read profile — has no mobile equivalent yet).
3. Work through whatever remains in `memory-bank/userActionsNeeded.md`.

## What Exists Now

- npm workspaces monorepo: `apps/web`, `apps/mobile`, `packages/{config,types,ui,api,ai}`,
  `supabase/`, `scripts/`.
- `apps/web`: Next.js 16 App Router. Sidebar workspace shell plus every V1 route — dashboard,
  Create with AI, calendar (month grid), content library with status filters, generated post
  detail, Brand Brain, assets, analytics, inbox and settings. Every route renders per request.
- `apps/mobile`: Expo SDK 57 with expo-router. Five bottom tabs (Home, Create, Calendar, Library,
  More) plus the immersive post review screen.
- `apps/*/src/lib/data.ts`: the only seam between screens and their data source. Every reader runs
  a real Supabase query scoped only by RLS — no explicit user/org filter, Postgres decides what
  comes back. Returns empty results today only because the project has no organizations yet.
- `packages/types`: `database.ts` generated from the live schema, with derived domain types and
  enum-drift guards that fail the build if a runtime constant diverges from a database enum.
- `packages/ui`: design tokens (`tokens.ts` + `tokens.css`) and the shared status presentation map
  both apps render chips from.
- `packages/ai`: model ids, the prompt framework, structured-output schemas, and `safety.ts` —
  prompt-injection containment and model output validation, under 24 tests.
- `supabase/migrations/`: eight migrations, all applied (the eighth adds Vault-backed provider
  secret storage for Milestone 9).
- `supabase/functions/`: seven deployed Edge Functions — `generate-post`, `generate-image`,
  `connect-instagram`, `publish-instagram-post`, `sync-post-metrics`, `meta-webhook`, plus
  `_shared/ai.ts` (a self-contained Deno copy of `packages/ai/src`, not a real import — see that
  file's header comment). All follow the same gate shape from `docs/SECURITY.md`; all verified to
  fail closed (401 unauthenticated, or a clean 503/400 when a secret is missing) — none has been
  exercised with a real Gemini or Meta call yet.
- `scripts/`: `generate-database-types.mjs` and `check-client-bundle.mjs`.

## Custom domain

Production is served from `https://socialai.madeforth.net` (Vercel project
`social-media-agen-ai-web`). DNS is a CNAME at Cloudflare (`socialai` → Vercel's assigned target,
proxy disabled/DNS-only — required, an orange-clouded/proxied record breaks Vercel's TLS
provisioning). Site-wide basic auth (`SITE_BASIC_AUTH_USER`/`SITE_BASIC_AUTH_PASS`, prior commit)
applies on every domain automatically since it's request-level, not domain-level.

## Supabase

Project `Apex Social AI`, ref `dxdbqikzbytenmdrkkgo`, region `eu-central-1`, PostgreSQL 17.
The repo is linked; `supabase/.temp/project-ref` holds the ref.

- All eight migrations applied. 14 tables in `public`, all with RLS, plus `ai_quotas`. 5 policies
  on `storage.objects`. Two private buckets. `supabase_vault` extension enabled for provider
  secret storage.
- `npx supabase db advisors --linked --level warn` reports zero findings.
- Regenerate types with `npm run types:generate` after every migration. Do not pipe the CLI output
  into the file directly — that drops the header. The file is Prettier-ignored so regenerated
  output stays byte-comparable.
- Local credentials are in `apps/web/.env.local` and `apps/mobile/.env`, both gitignored. Clients
  use the `sb_publishable_...` key. **These are local files, not checked in** — if they're missing
  on a machine (a fresh checkout has no way to carry them), recreate them with
  `npx supabase link --project-ref dxdbqikzbytenmdrkkgo` then
  `npx supabase projects api-keys --project-ref dxdbqikzbytenmdrkkgo` (the CLI session must already
  be logged in) and copy the `publishable` key plus `https://dxdbqikzbytenmdrkkgo.supabase.co` into
  both files per `.env.example`. Symptom when missing: every route redirects to `/sign-in` and the
  proxy throws "Missing Supabase URL" — because `getServerSupabase()`/the SSR client can't build.
- The Auth admin API still requires the legacy `service_role` JWT; the new `sb_secret_...` key is
  rejected with "Invalid API key".
- There is no data in the project: zero users, zero rows, zero storage objects.
- Google OAuth is enabled and verified end to end in production, on the real custom domain
  (`https://socialai.madeforth.net`, see "Custom domain" below): sign-in, Supabase callback and
  session all completed with no error. Supabase Authentication → URL Configuration Site
  URL/Redirect URLs were updated to the production domain (were still pointing at `localhost:3000`,
  which is what caused the first attempt's Turbopack runtime error on the client bundle).

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

Also enforced now (Milestone 9, see `docs/SECURITY.md`): the full Edge Function gate on all six
functions; Instagram webhook signature verification (`meta-webhook`, timing-safe HMAC check before
any payload is parsed); provider tokens live only in Supabase Vault, never in a table.

Not yet addressed: upload content inspection, auth brute-force tuning, recording which user
approved a post, Meta token refresh/rotation, and cron-triggered auto-publish (deliberately cut —
see `docs/SECURITY.md`). No penetration testing has been done.

## Completed — Milestone 4: Google Auth + brand selection

Auth is Google OAuth through Supabase Auth on both clients (user's choice — email/magic-link were
also considered). Scope was one implicit brand per organization; a brand switcher between many was
explicitly out of scope.

Web:

- `packages/api/src/client.ts` gained `createSsrBrowserClient`/`createSsrServerClient` (from
  `@supabase/ssr`, newly a dependency) alongside the existing plain `createBrowserClient` mobile
  keeps using. The web session lives in cookies, not `localStorage`, so the proxy and Server
  Components can read it.
- `apps/web/src/proxy.ts` now also gates every `[locale]` route behind `supabase.auth.getUser()` —
  no session → redirect to `/${locale}/sign-in?next=...`; session present on `/sign-in` → redirect
  home. `/auth/*` is exempt (it's the callback target, not a screen).
- `apps/web/src/app/[locale]/sign-in/page.tsx` (Google button) and
  `apps/web/src/app/auth/callback/route.ts` (`exchangeCodeForSession`, deliberately outside
  `[locale]`) are new.
- `apps/web/src/lib/data.ts` is no longer stubbed — see "What Exists Now" above.
- `apps/web/src/lib/actions.ts`: `createOrganizationAndBrand` (Settings page form — inserts
  `organizations` then `brands`; the `organizations_add_owner` trigger makes the caller `OWNER`
  before the second insert runs) and `signOutAction`.
- Settings gained an Account card (email + sign out) and the brand row became a real create form.
  Topbar's avatar initials come from the session email now, not a hardcoded "MA". The old "Not
  connected to Supabase" badge is gone — the app is actually connected now.

Mobile:

- `apps/mobile/src/auth/provider.tsx`: same shape as the i18n provider. Google sign-in uses
  `expo-web-browser`'s `openAuthSessionAsync` plus `expo-linking`'s `createURL('auth-callback')`
  (scheme `apexsocial://`, already in `app.json`) — Supabase's implicit-flow redirect fragment
  (`#access_token&refresh_token`) is parsed manually and passed to `supabase.auth.setSession()`.
- `apps/mobile/app/_layout.tsx` uses `Stack.Protected` (Expo Router's auth-guard API) to swap
  between `(tabs)` and a new `sign-in.tsx` screen based on session state — no manual redirect logic.
- `apps/mobile/src/lib/data.ts`: same real-query shift as web, hook-shaped, each depending on
  `useCurrentBrand()`. `createOrganizationAndBrand` also exists here (called directly, no
  server-action layer on mobile — RLS is the only gate either way).
- `apps/mobile/app/(tabs)/more.tsx` gained the brand-creation form and a Sign out row.

Verification:

- Full-workspace typecheck, web lint, `npm test` (24/24), web production build (12 routes
  including `sign-in` and `auth/callback`), and `verify:bundle` all pass.
- Browser-verified against a real dev server: unauthenticated `/`, `/tr/library` etc. all redirect
  to `/tr/sign-in?next=...`; clicking "Continue with Google" reaches Supabase's real
  `/auth/v1/authorize` with the correct PKCE challenge and redirect — it currently returns
  `provider is not enabled`, which is expected until the dashboard step above is done; `/auth/callback`
  with no `code` redirects to sign-in instead of crashing.
- Completed Google sign-in on the production domain is now verified. **Still not verified**: brand
  creation, sign-out and RLS isolation between two real accounts through the UI, and native mobile
  OAuth (the deep-link round trip), which has never run on a device or simulator.

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

- No performance metric is invented. Analytics tiles render as unavailable until an account is
  connected and a post's metrics have actually been synced — profile visits stays permanently
  unavailable since Instagram's per-media insights have no such metric to report.
- Dashboard counters are derived from the posts themselves, so a number can never disagree with
  what is on screen.

## Current Visual Reference

`assets/reference/ui-concept.png`
