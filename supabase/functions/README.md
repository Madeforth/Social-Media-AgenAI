# Edge Functions

All privileged work runs here: Gemini calls, Meta Graph API calls, publishing
jobs and token refresh. Clients never hold provider secrets.

Planned functions (see `docs/ARCHITECTURE.md`):

- `generate-content-plan`
- `generate-post`
- `regenerate-post`
- `generate-image`
- `approve-post`
- `schedule-post`
- `publish-instagram-post`
- `refresh-meta-token`
- `sync-post-metrics`
- `send-approval-notification`

Secrets are read from the Supabase environment, never from a committed file:

```bash
npx supabase secrets set GEMINI_API_KEY=...
```

Functions run on Deno, so they cannot import npm workspace packages by name.
Share portable logic through `packages/ai`, which is dependency-free TypeScript.
