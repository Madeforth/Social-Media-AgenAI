# Progress

## Completed

- Product direction defined.
- Serverless-first constraint defined.
- Primary stack selected.
- Web/mobile visual concept generated.
- Core AI workflow defined.
- Multi-brand-ready direction selected.
- Monorepo bootstrap (Milestone 1): npm workspaces, shared packages, Next.js web app,
  Expo mobile app, design tokens, Supabase local config scaffold.
- Schema migrations and RLS policies (Milestone 2), applied to a live Supabase project, with
  TypeScript types generated from the running schema.
- Design system shell on web and mobile (Milestone 3): sidebar workspace with every V1 route,
  five-tab mobile navigation, shared tokens and status presentation, and a data-access seam per
  app that currently returns empty results.
- Security work in front of the AI runtime: web security headers with a nonce-based CSP, database
  cost limits, a client-bundle secret scanner, and prompt-injection containment plus model output
  validation.
- Turkish/English localization on web and mobile. Web uses locale-prefixed routes with negotiated
  cookie persistence; mobile uses the device locale plus a persistent in-app selector. All screen
  copy, navigation, statuses, domain labels and dates follow the active locale.
- Auth and brand selection (Milestone 4): Google OAuth via Supabase Auth on web (cookie-based
  session, proxy route guard) and mobile (`expo-web-browser` + deep link), one implicit
  brand-per-organization creation flow on both, and the data-access seam now runs real
  RLS-scoped Supabase reads instead of stubs.

- Brand Brain and Asset Library writes (Milestone 5): a real edit form for `brand_guidelines`
  (upsert), and upload/delete for `brand_assets` into the private `brand-assets` Storage bucket.
  All writes run through the caller's own session, gated by the existing RLS policies — no
  service-role path added.

- The Edge Function security gate and Gemini integration (Milestone 6): `generate-post` deployed
  to the linked Supabase project, running all six checks from `docs/SECURITY.md` in order —
  verified that an unauthenticated call is refused before the function body runs. The web
  "Create with AI" page's brief field and generate button are wired to it through a new
  `generatePost` server action. **Not yet exercised with a real Gemini call** — `GEMINI_API_KEY`
  is not set as a project secret yet, a step only the project owner can do (see
  `memory-bank/userActionsNeeded.md`); the function returns 503 without crashing when the key is
  absent, which was verified.

- Image generation and storage workflows (Milestone 7): `generate-image` Edge Function, deployed,
  running the same six-step gate as `generate-post`. Turns a post version's stored creative
  direction/generation prompt into an image via Gemini's image model, uploads it into the private
  `generated-images` bucket at `<brand_id>/<post_id>/<version_id>.png`, and updates that version's
  `image_storage_path`. The post detail page now signs a URL for that path and renders the real
  image in `CreativePreview` when one exists (still the gradient placeholder elsewhere — library,
  calendar, dashboard cards were not changed), plus a Generate/Regenerate image button. Same
  not-yet-exercised caveat as Milestone 6: needs `GEMINI_API_KEY` set.

- Approval, revision and scheduling (Milestone 8): `approvePost`/`requestRevision`/`schedulePost`
  server actions (direct RLS-gated `posts` updates — no Edge Function needed, these are just
  status/timestamp writes, not privileged calls). A human edit never overwrites a version in
  place — `editPostVersion` and the new `/posts/[id]/edit` page append a `created_by: 'USER'`
  version and move `current_version_id`, carrying over the image and creative direction. Extended
  `generate-post` to accept an optional `post_id`: when present it appends a new AI version to
  that post (the "Regenerate" button, with an optional revision-note textarea) instead of creating
  a new post — same six-step gate, redeployed. The post detail page's header buttons and the
  Schedule card are now functional instead of placeholders; the calendar page already read real
  `scheduled_at`/`published_at` data from Milestone 3, so scheduled posts appear there with no
  further change needed.

- Meta integration and publishing (Milestone 9): a Vault-backed secret store (new migration —
  `store_provider_secret`/`read_provider_secret`, `service_role`-only, mirrors the `ai_allowance`
  wrapper pattern), four new Edge Functions (`connect-instagram`, `publish-instagram-post`,
  `sync-post-metrics`, `meta-webhook`), all deployed and verified to fail closed. Settings gained a
  real Instagram connect form (V1 is a pasted long-lived token, verified against the Graph API
  before it's stored — not a full Meta OAuth consent screen, which needs a reviewed Meta app the
  project owner has to create). The post detail page gained a "Publish now" button for
  APPROVED/SCHEDULED posts.
  **Deliberately not built**: cron-triggered auto-publish at `scheduled_at` — building
  `pg_cron`/`pg_net` blind, with no live Meta credentials to test against, was judged too risky for
  an unattended session. V1 publishing is the manual button. See
  `memory-bank/userActionsNeeded.md` for the Meta app setup this all still needs before it can be
  exercised for real.

- Basic analytics: `getAnalyticsSummary()` sums each published post's most recent `post_metrics`
  snapshot for the brand (impressions, reach, engagement = likes+comments+saves+shares).
  Profile visits stays permanently unavailable (`null`) — Instagram's media insights have no
  per-post profile-visit metric, so there is nothing to sum; the tile says so rather than showing
  a fabricated number. A "Sync metrics" button on the post detail page (shown once a post is
  PUBLISHED) calls `sync-post-metrics`; the Analytics page distinguishes three real states: no
  account connected, connected but nothing synced yet, and real numbers.

## In Progress

- None. All nine numbered milestones plus basic analytics are done. Notifications (the
  `notifications` table exists with RLS from Milestone 9's migration, but nothing writes rows or
  renders a UI for it yet) is the one remaining unscheduled item from CLAUDE.md's "Not Started"
  list.

## Not Started

- Notifications: no writer, no UI. Would need something to call `insert` on `public.notifications`
  (an Edge Function is the natural place, e.g. on generation completing or a publish failing) and
  a topbar/inbox surface to read and mark them read — `notifications_select`/`notifications_update`
  policies already exist and are scoped to the caller's own `user_id`.

## Verification — Milestone 1, monorepo

- `npm run typecheck --workspaces` passes.
- `npm run build --workspace @apex/web` succeeds.
- `npx expo export --platform ios` bundles, so Metro resolves workspace packages.
- `npm run lint --workspace @apex/web` passes.

## Verification — Milestone 3, the shell

- The web build produces every route, each route returns 200, and an unknown post id returns 404,
  checked against a production server.
- Web renders with zero console errors or warnings, so there is no hydration mismatch.
- `npx expo export --platform ios` bundles, and every mobile route was rendered through
  `expo start --web` with zero console errors.
- NOT verified: the mobile app has never run on a real iOS or Android device or simulator.
  Rendering was checked through react-native-web, which does not exercise native layout.
- NOT verified: no screen has been seen rendering a populated list, because there is no data
  source yet. Only the empty states have actually been exercised.

## Verification — TR/EN localization

- Web production build exposes every route under both `/tr` and `/en`; locale switching and an
  English internal navigation were exercised in Chrome and kept the correct prefix.
- Mobile typecheck plus iOS and Android production exports pass. The react-native-web verification
  surface switched every visible label and tab from Turkish to English, then retained English
  after reload through AsyncStorage.
- `npm run lint`, full-workspace `npm run typecheck`, all 24 tests and the client-bundle secret
  scan pass after the localization work.
- Native layout and the native persistence bridge are not yet exercised on a real device or
  simulator.

## Verification — Milestone 4, auth and brand selection

- Full-workspace typecheck, web lint, `npm test` (24/24), web production build (12 routes,
  including the new `sign-in` and `auth/callback`) and `verify:bundle` all pass.
- Browser-verified against a real dev server: every unauthenticated path redirects to
  `/tr/sign-in?next=...`; "Continue with Google" reaches Supabase's real `/auth/v1/authorize`
  endpoint with a correct PKCE challenge and redirect URL; `/auth/callback` with no `code` redirects
  to sign-in rather than crashing.
- NOT verified: an actual completed Google sign-in, brand creation, sign-out, or RLS isolation
  between two real signed-in accounts — Google OAuth is coded correctly end-to-end but the provider
  is not yet enabled in the Supabase dashboard (returns `provider is not enabled`), which is a
  manual step only the project owner can do. Native mobile OAuth has never run on a device or
  simulator.

## Verification — the live database

- All seven migrations applied to `dxdbqikzbytenmdrkkgo`. 13 tables, all with RLS, 5 policies on
  `storage.objects`, 2 private buckets, 0 grants for `anon`.
- `supabase db advisors --linked --level warn`: zero findings.
- Types generated from the live schema; `npm run typecheck --workspaces` passes, which means the
  enum-drift guards check the runtime constants against the real database enums.
- RLS proved end to end with two real users: an owner can create an organization and a brand and
  read them back; the trigger grants OWNER; a stranger sees zero organizations and zero brands,
  cannot insert into another organization, and an update against another organization's brand
  affects zero rows. 10/10 checks passed and both users were deleted afterwards.
- An unauthenticated client is denied on every table, and the RLS helpers have no RPC endpoint.
- `social_accounts`: naming columns works, `select('*')` and `select('token_secret_ref')` are both
  denied.
- The first push failed on a real ordering defect that parsing had not caught, and the migrations
  were corrected before the schema was rebuilt.

## Verification — the security work

- AI quota enforcement proved end to end: the allowance flips to refused at exactly the hourly
  limit, a client cannot raise its own quota, cannot forge audit rows, and cannot call the
  allowance endpoint. 9/9 checks.
- Web security headers present on a production response, the nonce present in the HTML, and pages
  render with zero console errors including after client-side navigation.
- `npm run verify:bundle` proved to work in both directions: it exits 1 on a planted key and 0 on a
  clean build.
- `npm test`: 24 tests covering prompt containment and model output validation.
- NOT verified: no Edge Function exists, so nothing has exercised the runtime gate in front of
  Gemini. No penetration testing has been performed.

## Validation Criteria for MVP

- Same account works on web/iOS/Android.
- Brand data syncs correctly.
- Gemini generates usable content proposals.
- Generated visuals are persisted in Storage.
- User can revise/approve content.
- Scheduled approved content publishes to Instagram.
- Status updates sync across clients.
