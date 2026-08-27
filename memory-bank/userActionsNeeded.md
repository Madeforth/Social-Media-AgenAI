# User Actions Needed

Running list of steps only the project owner can do (dashboard clicks, API keys, paid
accounts, device testing). Building autonomously overnight per /goal set 2026-08-27 23:00,
target finish 2026-08-28 08:00. Check items off as done; add a date when completed.

## Pending

- [ ] Gemini API key: create in Google AI Studio / Google Cloud, then run
      `npx supabase secrets set GEMINI_API_KEY=... --project-ref dxdbqikzbytenmdrkkgo`. The
      `generate-post` Edge Function is deployed and live but returns 503 without this — verified
      it fails cleanly rather than crashing. Once set, test a real generation from
      `/create` on the production site (needs a signed-in account with a brand — see the brand
      creation item below) and watch `npx supabase functions logs generate-post` for the first
      real Gemini call.
- [ ] Meta (Instagram) app: create a Meta for Developers app, add Instagram Graph API product,
      generate a long-lived access token for the target Instagram Business account, add as
      `META_ACCESS_TOKEN` / `META_APP_SECRET` in Supabase Edge Function secrets. Meta app review
      may be required for `instagram_content_publish` permission before real publishing works —
      this can take days and is entirely on Meta's side.
- [ ] Native mobile OAuth: run the Expo app on a real iOS/Android device or simulator at least
      once and complete a Google sign-in through the deep link, since this has never been
      exercised outside react-native-web.
- [ ] Native mobile layout: view every screen on a real device/simulator — react-native-web
      verification does not exercise native layout engines.
- [ ] Brand creation / sign-out / RLS isolation through the real UI with two real Google
      accounts (was only proved earlier via direct DB scripts, not the browser).
- [ ] Decide and confirm: is `Apex Flow` the first real brand's exact name/handle for the
      Instagram account being connected?

## Done

- [x] (2026-08-27) Custom domain `socialai.madeforth.net` — Cloudflare CNAME + Vercel, DNS-only
      proxy, valid config confirmed.
- [x] (2026-08-27) Google OAuth Supabase URL Configuration pointed at the production domain
      instead of localhost; full Google sign-in verified end to end on production.
