# Architecture

## High-Level

```text
                ┌─────────────────┐
                │   Next.js Web   │
                └────────┬────────┘
                         │
┌─────────────────┐      │      ┌──────────────────┐
│ Expo iOS/Android│──────┼──────│ Supabase Auth   │
└─────────────────┘      │      └──────────────────┘
                         │
                  ┌──────▼──────────┐
                  │   Supabase      │
                  │ PostgreSQL      │
                  │ Storage         │
                  │ Realtime        │
                  │ Edge Functions  │
                  │ Cron            │
                  └───┬────────┬────┘
                      │        │
                ┌─────▼───┐ ┌──▼──────────────┐
                │ Gemini  │ │ Meta Graph API  │
                │ API     │ │ Instagram       │
                └─────────┘ └─────────────────┘
                      │
                ┌─────▼──────────────┐
                │ Push Notification  │
                │ Firebase / Expo    │
                └────────────────────┘
```

## Why This Architecture

- No server management.
- Low fixed cost.
- Shared source of truth.
- Easy web/mobile sync.
- Secrets stay server-side.
- Scales gradually.

## Primary Edge Functions

Suggested functions:

- `generate-content-plan`
- `generate-post`
- `regenerate-post`
- `generate-image`
- `approve-post`
- `schedule-post`
- `publish-instagram-post`
- `refresh-meta-token`
- `sync-post-metrics` (later)
- `send-approval-notification`

## Cron Jobs

- publish due posts every 5–10 minutes
- refresh expiring tokens
- metrics sync later
