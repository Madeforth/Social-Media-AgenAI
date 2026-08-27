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
- [ ] Meta (Instagram) app: create a Meta for Developers app, add the Instagram Graph API
      product, and get a long-lived access token plus the numeric Instagram Business Account ID
      for the target account (Meta Business Suite, or the Graph API Explorer). Meta app review may
      be required for `instagram_content_publish` before real publishing works — this can take
      days and is entirely on Meta's side. Once you have the token and account ID, paste them
      into **Settings → Integrations → Instagram** on the live site — the form is built and
      deployed (`connect-instagram` Edge Function), it validates the token against the Graph API
      before storing it, and no manual `supabase secrets set` is needed for this part.
- [ ] `npx supabase secrets set META_APP_SECRET=... --project-ref dxdbqikzbytenmdrkkgo` — needed
      only for the webhook (`meta-webhook`, deployed) to verify signatures from Meta. Also set
      `META_WEBHOOK_VERIFY_TOKEN` to any string of your choosing, then register the webhook URL
      `https://dxdbqikzbytenmdrkkgo.supabase.co/functions/v1/meta-webhook` in the Meta app
      dashboard with that same verify token — this is optional and only matters once an Inbox
      feature is built to consume webhook payloads; nothing currently reads them.
- [ ] Scheduled posts do not auto-publish. Click **Publish now** on the post detail page at or
      after the scheduled time — building unattended cron-triggered publishing without live Meta
      credentials to test against was judged too risky to do blind overnight. See
      `docs/SECURITY.md`'s Milestone 9 section for the full reasoning; this can be revisited once
      the Meta app above is working end to end.
- [ ] Native mobile OAuth: run the Expo app on a real iOS/Android device or simulator at least
      once and complete a Google sign-in through the deep link, since this has never been
      exercised outside react-native-web.
- [ ] Native mobile layout: view every screen on a real device/simulator — react-native-web
      verification does not exercise native layout engines.
- [ ] Brand creation / sign-out / RLS isolation through the real UI with two real Google
      accounts (was only proved earlier via direct DB scripts, not the browser).
- [ ] Decide and confirm: is `Apex Flow` the first real brand's exact name/handle for the
      Instagram account being connected?
- [ ] Optional hardening: Supabase Dashboard → Authentication → Policies has "Leaked Password
      Protection" disabled (flagged by `supabase db advisors`, pre-existing, unrelated to tonight's
      work) — checks new passwords against HaveIBeenPwned. Not required to launch, worth flipping
      on when convenient.

## Done

- [x] (2026-08-27) Custom domain `socialai.madeforth.net` — Cloudflare CNAME + Vercel, DNS-only
      proxy, valid config confirmed.
- [x] (2026-08-27) Google OAuth Supabase URL Configuration pointed at the production domain
      instead of localhost; full Google sign-in verified end to end on production.
