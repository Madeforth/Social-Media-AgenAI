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
- Schema migrations and RLS policies written (Milestone 2), plus the TypeScript database
  contract and derived domain types.
- Design system shell on web and mobile (Milestone 3): sidebar workspace with every V1 route,
  five-tab mobile navigation, shared tokens and status presentation, deterministic fixtures.

## In Progress
- Milestone 2 is written but unverified: the migrations have never been applied to a database.

## Not Started
- Applying migrations to a real Supabase project
- Regenerating database types from the live schema
- Auth
- Replacing fixtures with live Supabase reads
- Gemini integration
- Storage workflows
- Meta integration
- Notifications
- Analytics

## Verification Run At Milestone 1
- `npm run typecheck --workspaces` passes.
- `npm run build --workspace @apex/web` produces a static build.
- `npx expo export --platform ios` bundles successfully, so Metro resolves workspace packages.
- `npm run lint --workspace @apex/web` passes.

## Verification Run At Milestone 2
- All six migrations parse cleanly under libpg_query (147 statements total).
- `npm run typecheck --workspaces` passes with the derived domain types.
- Enum-drift guards confirmed to fail the build when a status is removed from a runtime constant.
- NOT verified: the migrations have not been executed, so semantic errors (a bad column
  reference inside a policy, an ordering problem) would not have been caught.

## Verification Run At Milestone 3
- `npm run build --workspace @apex/web` builds all 12 routes.
- Every web route returns 200 and an unknown post id returns 404, checked against the production
  server.
- Web renders with zero console errors or warnings, so there is no hydration mismatch.
- `npx expo export --platform ios` bundles, and every mobile route was rendered through
  `expo start --web` with zero console errors.
- `npm run typecheck --workspaces` and `npm run lint --workspace @apex/web` pass.
- NOT verified: the mobile app has never run on a real iOS or Android device or simulator.
  Rendering was checked through react-native-web, which does not exercise native layout.

## Validation Criteria for MVP
- Same account works on web/iOS/Android.
- Brand data syncs correctly.
- Gemini generates usable content proposals.
- Generated visuals are persisted in Storage.
- User can revise/approve content.
- Scheduled approved content publishes to Instagram.
- Status updates sync across clients.
