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
Decision: `packages/types/src/database.ts` holds the row shapes, and the domain modules derive from it with narrowed jsonb types. Exported `*_ENUM_MATCHES` constants fail the build if a runtime constant drifts from its database enum. The file is hand-maintained until a Supabase project exists, then regenerated with `supabase gen types typescript`.

## 2026-08-27 — Migrations Not Yet Executed
Decision: Milestone 2 ships migrations verified only by parsing them with libpg_query, because neither Docker nor a local PostgreSQL is available on this machine and no Supabase project is provisioned. They must be applied against a real database before Milestone 3 depends on them.
