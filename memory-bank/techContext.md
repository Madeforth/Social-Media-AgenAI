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

## Development Workflow

The owner will develop primarily through ORCA using Claude for vibe coding.

## Cost Principle

Start with free/usage-based tiers. Avoid fixed recurring infrastructure until real usage requires it.

## Security Principle

All secret-bearing integrations remain server-side. Mobile/web clients never receive provider secrets.
