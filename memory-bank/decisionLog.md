# Decision Log

## 2026-08-27 — Runtime AI

Decision: Gemini is the production AI runtime. Claude is used as the development copilot inside ORCA.

## 2026-08-27 — Backend

Decision: Supabase is the primary backend for database, auth, storage, realtime, Edge Functions and scheduled jobs.

## 2026-08-27 — No Dedicated Server

Decision: Do not require a VPS/dedicated server. Avoid self-hosted n8n for V1.

## 2026-08-27 — Mobile

Decision: Expo React Native to produce iOS and Android from one TypeScript codebase.

## 2026-08-27 — Web

Decision: Next.js deployed to Vercel.

## 2026-08-27 — Images

Decision: Store image files in Supabase Storage; only store references and metadata in PostgreSQL.

## 2026-08-27 — Approval

Decision: Human approval is mandatory by default in V1.

## 2026-08-27 — Design

Decision: Premium dark creative SaaS aesthetic inspired by `assets/reference/ui-concept.png`; do not copy layouts rigidly.

## 2026-08-27 — Package Manager
Decision: npm workspaces. pnpm was not installed and npm hoisting works cleanly with both Next.js and Expo Metro, so adding another tool was not justified.

## 2026-08-27 — Shared Packages Ship TypeScript Source
Decision: `packages/*` expose `src/index.ts` directly instead of a build step. Next.js compiles them via `transpilePackages`; Metro resolves them through `watchFolders`. Avoids a build-order problem while the codebase is small.

## 2026-08-27 — React Version Alignment
Decision: pin `apps/web` to the same React version Expo pins for `apps/mobile` (19.2.3). Divergent versions caused npm to nest `next` inside `apps/web/node_modules`, which broke `eslint-config-next` parser resolution.

## 2026-08-27 — Mobile Navigation
Decision: expo-router (file-based routing) rather than the blank template's single-screen setup. The product needs a bottom tab shell, and expo-router is the Expo-supported default.

## 2026-08-27 — packages/ai Is Dependency-Free
Decision: `packages/ai` contains only prompts, model ids and JSON schemas, with no runtime dependencies and no network code, so Deno-based Edge Functions can consume the same source as the Node workspaces.

## 2026-08-27 — Dark Only
Decision: the web app ships a single dark theme with no light mode. Generated creative must be reviewed against consistent near-black surfaces.

## 2026-08-27 — Database Enums
Decision: domain statuses and type columns are PostgreSQL enums rather than `text`. The canonical post statuses become a database-enforced contract, and `packages/types` derives its unions from the same list.

## 2026-08-27 — RLS Through SECURITY DEFINER Helpers
Decision: policies call `is_organization_member`, `has_organization_role`, `can_read_brand`, `can_write_brand` and `can_administer_brand` instead of inlining joins. This avoids infinite recursion when a policy on `organization_members` needs to check membership, and keeps the role model in one place. The helpers never take a user id; the acting user comes from `auth.uid()`.

## 2026-08-27 — Server-Only Writes
Decision: `ai_generations`, `publication_jobs` and `post_metrics` have no client write policy; Edge Functions write them with the service role. `social_accounts.token_secret_ref` is excluded from the `authenticated` column grant so no client can read it.

## 2026-08-27 — Types Derived From The Database Contract
Decision: `packages/types/src/database.ts` holds the row shapes, and the domain modules derive from it with narrowed jsonb types. Exported `*_ENUM_MATCHES` constants fail the build if a runtime constant drifts from its database enum.

Update, same day: the file is now generated from the live schema, so those guards check against the real database enums rather than a hand-written copy. Regenerate with `npm run types:generate`, which preserves the do-not-edit header that a bare CLI redirect would drop.

## 2026-08-27 — Migrations Verified By Parsing Only
Decision: Milestone 2 shipped migrations verified only by parsing them with libpg_query, because neither Docker nor a local PostgreSQL is available on this machine.

Resolved, same day: a Supabase project was provisioned and all migrations were applied. Parsing turned out not to be enough — see "Migration Ordering Caught Only By Executing" below. Treat a parse pass as evidence of syntax and nothing more.

## 2026-08-27 — No Fabricated Metrics In The UI
Decision: impressions, reach, engagement and profile visits are rendered as unavailable until an Instagram account is connected, and dashboard counters are derived from the posts themselves. CLAUDE.md forbids fabricating metrics, and a placeholder number would be indistinguishable from a real one once the account is live.

## 2026-08-27 — Hand-Written Icons Instead Of An Icon Library
Decision: icons are hand-written SVG, shared in shape between the web app and the mobile app (which draws them through `react-native-svg`). The stack already renders SVG on both platforms, so an icon library would add a dependency for a dozen simple paths.

## 2026-08-27 — react-native-web For Verification
Decision: `react-native-web`, `react-dom` and `@expo/metro-runtime` are installed in `apps/mobile` so the mobile app can be rendered and inspected in a browser during development. This is a verification surface, not a shipping one — the product web client is `apps/web`. It caught a real defect: `<Link asChild>` renders through `<Slot>`, which cannot merge an array of styles onto the cloned child.

## 2026-08-27 — Mobile Calendar Is An Agenda, Not A Grid
Decision: the mobile calendar renders a chronological agenda rather than a month grid. A 7x6 grid of tap targets does not survive a phone width at a usable size, and the mobile approval flow is optimised for one-handed use.

## 2026-08-27 — No Mock Data, Ever
Decision: the project never contains mock data, and this rule is principle 11 in CLAUDE.md. It covers fixture packages, sample rows, seed data, hardcoded example content and placeholder numbers, including temporary ones added while a backend is missing. Screens read through a data-access seam and render real loading, empty and error states instead.

## 2026-08-27 — Data Access Seam
Decision: screens read through a single module per app — `apps/web/src/lib/data.ts` and `apps/mobile/src/lib/data.ts`. Today every reader returns an empty result, so the screens render their empty states. When Supabase exists only these bodies change. Web exposes async functions consumed by server components; mobile exposes hooks returning `{ data, loading, error }` so the screens already handle all three states.

## 2026-08-27 — Supabase Project
Decision: the project is `Apex Social AI`, ref `dxdbqikzbytenmdrkkgo`, in `eu-central-1` (Frankfurt) — the closest region to the owner, so user-facing latency wins over proximity to Gemini and the Meta API. It is a second project in the same organization; the pre-existing `Madeforth's Project` was left untouched.

## 2026-08-27 — RLS Helpers Live In A `private` Schema
Decision: the SECURITY DEFINER helpers were moved out of `public`. PostgREST exposes `public`, so a helper there is callable as an RPC endpoint; in `private` it is not, while policies still work because policy expressions run with the calling role's privileges and `authenticated` holds `USAGE` on the schema. Supabase's own advisor flagged the original placement.

## 2026-08-27 — Write Policies Are Per-Command
Decision: write policies are declared as separate `INSERT`, `UPDATE` and `DELETE` policies instead of one `FOR ALL`. A `FOR ALL` policy also matches `SELECT`, leaving two permissive read policies on the same table that Postgres must evaluate on every read.

## 2026-08-27 — Publishable Key, Not The Legacy Anon JWT
Decision: clients use the `sb_publishable_...` key and the environment variables are named `*_SUPABASE_PUBLISHABLE_KEY`. supabase-js 2.112 supports it, and the naming matches what is actually in the bundle. The legacy `service_role` JWT is still what the Auth admin API accepts — the new secret key was rejected with "Invalid API key" — so admin scripts use the JWT.

## 2026-08-27 — Migration Ordering Caught Only By Executing
Decision: helper functions are defined in the migration that creates the table they read, not up front. A `language sql` body is validated at creation time, so the original ordering failed on the first real push with `relation "public.organization_members" does not exist`. Parsing the SQL had not caught it — only running it did.

## 2026-08-27 — Nonce CSP Forces Per-Request Rendering
Decision: `apps/web` renders every route per request. A nonce-based CSP is issued by the middleware for each request, and Next can only stamp it onto its scripts while rendering — a statically prerendered page carries a stale nonce and the browser refuses every script on it, which is exactly what happened on the first attempt. It is also correct independently: every screen shows the signed-in user's own data, so there is no HTML here that is right to cache for someone else.

## 2026-08-27 — `connect-src` Excludes Gemini And Meta
Decision: the CSP allows the browser to reach only the app's own origin and Supabase. Gemini and the Meta Graph API are deliberately absent, so a browser that could reach them would itself be evidence that a key had leaked.

## 2026-08-27 — Cost Limits Live In The Database
Decision: AI spending limits are enforced by `ai_quotas` and `private.ai_allowance`, not by application code, and usage is counted from the `ai_generations` audit trail rather than a separate counter. An Edge Function bug, a retry storm or a stolen session therefore cannot spend more than the organization's allowance, and there is no counter that can drift out of sync with reality. Clients can read their limit so the UI can explain a refusal, but no policy grants a write.

## 2026-08-27 — Model Input Is Data, Model Output Is Untrusted
Decision: `packages/ai/src/safety.ts` wraps everything the model reads in a per-call random delimiter with an explicit "this is data" preamble, strips invisible and bidirectional characters, and caps input size. Everything the model writes is type-checked, length-checked and screened against the brand's forbidden claims before it reaches the database or a screen. Structured output makes the shape likely, not guaranteed, and a prompt is guidance, not an enforcement mechanism.

## 2026-08-27 — Vitest
Decision: Vitest is the test runner. The repo had no test infrastructure, which is a real gap rather than something the existing stack already covered — security code without tests is a claim, not a control.

## 2026-08-27 — No Unverified Edge Function Security Code
Decision: the Edge Function auth/authorization/rate-limit gate was specified in `docs/SECURITY.md` as the contract Milestone 6 must implement, rather than written now. There is no Deno runtime on this machine and no function to exercise it, and security code that people trust without it having been run is worse than an explicit gap.

## 2026-08-27 — Amend-And-Reset Only While The Database Is Empty
Decision: while the Supabase project holds no rows, a defect found in a freshly pushed migration is fixed in the migration itself and the schema rebuilt with `supabase db reset --linked`, rather than layered with a corrective migration. This was used twice and kept the migration history readable. The row count is checked first every time, and the moment there is real data the rule inverts: every correction becomes a new migration.

## 2026-08-27 — Turkish/English Localization On Both Clients
Decision: Turkish and English are first-class interface locales on web, iOS and Android. Turkish is
the fallback locale. Web follows Next.js's built-in `[locale]` plus dictionary pattern with no i18n
framework; locale is visible in the URL and persisted by the negotiation cookie. Mobile keeps
locale in a React context, initializes it from `expo-localization`, exposes the selector under More,
and persists an explicit choice with AsyncStorage. Domain status colors remain in `packages/ui`,
while each client supplies the localized label so English presentation constants never leak into a
translated screen.

## 2026-08-27 — Google OAuth, One Brand Per Organization
Decision: Supabase Auth's Google provider is the only sign-in method for V1 (email/password and
magic link were considered and dropped — the user picked Google explicitly). Web keeps its session
in cookies via `@supabase/ssr` so the proxy and Server Components can read it; mobile keeps
`@supabase/supabase-js`'s default client with an AsyncStorage adapter and drives the OAuth round
trip itself through `expo-web-browser` plus a deep link, since Supabase's browser-redirect flow
does not apply to a native app. "Brand selection" for V1 is deliberately just creating one brand
inside one new organization — the schema is multi-brand-ready, but no screen needs a switcher yet,
so building one now would be speculative. `getCurrentBrand()`/`useCurrentBrand()` pick the caller's
earliest brand with no explicit switching UI.

Every `lib/data.ts` reader now queries Supabase directly with **no explicit user/org filter** —
Row Level Security is the only access boundary, matching the pattern the client-creation code
comments already stated as the design intent. This was chosen over threading a user id through
every query because RLS already enforces it at the database layer regardless, and a redundant
application-level filter would be two sources of truth that could drift.

The Google Cloud OAuth client and the Supabase dashboard's provider toggle are **not something a
coding session can do** — no browser session logged into the user's Google/Supabase account exists
here. This is recorded as a standing manual prerequisite, not a bug: sign-in is coded and verified
up to the point Supabase's `/authorize` endpoint responds `provider is not enabled`.
