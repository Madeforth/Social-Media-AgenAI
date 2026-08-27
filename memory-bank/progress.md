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

## In Progress

- Web TR/EN i18n (unscheduled, web-only, not a numbered milestone). Route restructure to
  `app/[locale]`, middleware locale negotiation, and the dictionary infrastructure are committed;
  wiring pages/shell components to the dictionaries is not done — see `activeContext.md`.

## Not Started

- Auth and brand selection (Milestone 4)
- Wiring the data-access seam to live Supabase reads
- Brand Brain and Asset Library writes (Milestone 5)
- The Edge Function security gate and Gemini integration (Milestone 6 — contract in
  `docs/SECURITY.md`)
- Image generation and storage workflows (Milestone 7)
- Approval, revision and scheduling (Milestone 8)
- Meta integration and publishing (Milestone 9)
- Notifications
- Analytics

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
