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
  five-tab mobile navigation, shared tokens and status presentation, and a data-access seam per
  app that currently returns empty results.

## In Progress
- Nothing. Milestones 1-3 are closed and the Supabase project is live.

## Not Started
- The Edge Function security gate (contract written in docs/SECURITY.md)
- Auth
- Wiring the data-access seam to live Supabase reads
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

## Verification Run Against The Live Database
- All six migrations applied to `dxdbqikzbytenmdrkkgo`. 13 tables, 13 with RLS, 39 policies in
  `public`, 5 on `storage.objects`, 2 private buckets, 0 grants for `anon`.
- `supabase db advisors --linked --level warn`: zero findings.
- Types generated from the live schema; `npm run typecheck --workspaces` passes, which means the
  enum-drift guards now check the runtime constants against the real database enums.
- RLS proved end to end with two real users: an owner can create an organization and a brand and
  read them back; the trigger grants OWNER; a stranger sees zero organizations and zero brands,
  cannot insert into another organization, and an update against another organization's brand
  affects zero rows. 10/10 checks passed and both users were deleted afterwards.
- An unauthenticated client is denied on every table, and the RLS helpers have no RPC endpoint.
- `social_accounts`: naming columns works, `select('*')` and `select('token_secret_ref')` are both
  denied.
- The first push failed on a real ordering defect that parsing had not caught, and the migrations
  were corrected before the schema was rebuilt.

## Verification Run On The Security Work
- AI quota enforcement proved end to end: the allowance flips to refused at exactly the hourly
  limit, a client cannot raise its own quota, cannot forge audit rows, and cannot call the
  allowance endpoint. 9/9 checks.
- Web security headers present on a production response, nonce in the HTML, pages render with zero
  console errors including after client-side navigation.
- `npm run verify:bundle` proved to work in both directions: it exits 1 on a planted key and 0 on a
  clean build.
- `npm test`: 24 tests covering prompt containment and model output validation.
- NOT verified: no Edge Function exists, so nothing has exercised the runtime gate in front of
  Gemini. No penetration testing has been performed.

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
- NOT verified: no screen has been seen rendering a populated list, because there is no data
  source yet. Only the empty states have actually been exercised.

## Validation Criteria for MVP
- Same account works on web/iOS/Android.
- Brand data syncs correctly.
- Gemini generates usable content proposals.
- Generated visuals are persisted in Storage.
- User can revise/approve content.
- Scheduled approved content publishes to Instagram.
- Status updates sync across clients.
