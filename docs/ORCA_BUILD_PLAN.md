# ORCA + Claude Build Plan

## Recommended Working Style

Do not ask Claude to “build the whole app” in one shot.

Use milestone prompts.

### Milestone 1

“Read CLAUDE.md and all memory-bank files. Bootstrap the monorepo with Next.js web, Expo mobile, shared TypeScript package structure and Supabase local config. Do not implement product features yet.”

### Milestone 2

“Implement Supabase schema/migrations for organizations, brands, brand_guidelines, brand_assets, posts, post_versions and ai_generations. Add RLS and generated TypeScript types.”

### Milestone 3

“Implement the dark design system from docs/DESIGN_SYSTEM.md. Build the web shell/sidebar and mobile bottom navigation using mock data only.”

### Milestone 4

“Implement authentication and brand selection against Supabase.”

### Milestone 5

“Implement Brand Brain and Asset Library.”

### Milestone 6

“Implement generate-post Edge Function using Gemini structured outputs. Do not add image generation until text/strategy output is stable.”

### Milestone 7

“Add Gemini image generation/storage and post versioning.”

### Milestone 8

“Implement approval, revision and schedule flow.”

### Milestone 9

“Integrate Instagram publishing through Meta Graph API with server-side secrets only.”

## Every ORCA Session

At session start:

1. read CLAUDE.md
2. read activeContext.md
3. read progress.md
4. read decisionLog.md

At session end:

1. update activeContext.md
2. update progress.md
3. add important decisions to decisionLog.md
