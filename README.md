# Apex Social AI — Project Starter Pack

A serverless-first, AI-native social media operating system for web, iOS and Android.

The first production brand is **Apex Flow**, but the data model and product architecture are intentionally multi-brand-ready.

## Core Promise

A user can define a brand once, provide mission, vision, tone, product knowledge, visual rules, assets and optional UI screenshots, then ask Gemini to:

1. decide what should be posted,
2. choose the right content pillar and creative format,
3. write the headline, caption, CTA and hashtags,
4. generate the post visual,
5. present the result for approval,
6. schedule and publish it to Instagram,
7. store all non-image content and history centrally so web/iOS/Android stay synchronized.

## Stack

- Web: Next.js + TypeScript
- Mobile: Expo React Native + TypeScript
- Backend: Supabase
- Database: PostgreSQL via Supabase
- Auth: Supabase Auth
- Storage: Supabase Storage
- Serverless logic: Supabase Edge Functions + Cron
- AI runtime: Gemini API
- Push: Firebase Cloud Messaging / Expo Notifications
- Social publishing: Meta Graph API
- Web hosting: Vercel
- Development workflow: ORCA + Claude

## Important Constraint

No dedicated server, no VPS, no self-hosted n8n. The project must remain serverless/managed-first unless a future decision explicitly changes this.

## Start Here

1. Read `CLAUDE.md`.
2. Read every file in `memory-bank/` before making architectural changes.
3. Read `docs/PRODUCT_VISION.md`, `docs/ARCHITECTURE.md` and `docs/DESIGN_SYSTEM.md` before implementing UI or flows.
4. Use `assets/reference/ui-concept.png` as the visual direction reference.

## Development

```bash
npm install          # install all workspaces
npm run web          # Next.js dev server  (apps/web)
npm run mobile       # Expo dev server     (apps/mobile)
npm run typecheck    # type-check every workspace
npm run build        # build every workspace that has a build script
npm run format       # Prettier over source (spec docs are excluded)
```

Copy `.env.example` to `apps/web/.env.local` and `apps/mobile/.env` and fill in the
public Supabase values. Server-only secrets (Gemini key, Meta credentials, service
role key) belong in Supabase secrets and must never appear in a client bundle:

```bash
npx supabase secrets set GEMINI_API_KEY=...
```

### Workspace Layout

| Path | Purpose |
| --- | --- |
| `apps/web` | Next.js 16 App Router web client |
| `apps/mobile` | Expo SDK 57 + expo-router iOS/Android client |
| `packages/types` | Canonical domain types shared by every runtime |
| `packages/ui` | Design tokens (`tokens.ts` + `tokens.css`) |
| `packages/api` | Supabase client factories (public keys only) |
| `packages/ai` | Gemini prompts and structured-output schemas, dependency-free |
| `packages/config` | Shared TypeScript configuration |
| `supabase` | Local config, migrations and Edge Functions |
