# Technical Context

## Current Stack Decision

- TypeScript everywhere possible
- Next.js for web
- Expo React Native for mobile
- Supabase for backend/auth/db/storage/functions/cron
- Gemini API for production AI
- Firebase/Expo Notifications for push
- Meta Graph API for Instagram publishing
- Vercel for web deployment

## Infrastructure Constraint

No dedicated server or VPS can be assumed.

## Tooling

- npm workspaces, no additional package manager.
- Vitest for tests (`npm test`).
- Prettier and ESLint. Spec documents and generated files are Prettier-ignored.
- `scripts/generate-database-types.mjs` regenerates the database contract from the linked project.
- `scripts/check-client-bundle.mjs` fails if a server-only value reaches the browser bundle.

## Development Workflow

The owner will develop primarily through ORCA using Claude for vibe coding.

GitHub has exactly one branch, `main`. Commit and push directly to it; no feature branches, no
pull requests.

## Cost Principle

Start with free/usage-based tiers. Avoid fixed recurring infrastructure until real usage requires it.

## Security Principle

All secret-bearing integrations remain server-side. Mobile/web clients never receive provider
secrets. Clients hold only the project URL and the publishable key, and Row Level Security is the
access boundary — `anon` holds no grants at all.

`docs/SECURITY.md` is the authority, and it labels every control as enforced-and-verified or
planned.
