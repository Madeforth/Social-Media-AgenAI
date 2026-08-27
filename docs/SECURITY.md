# Security

## Secrets

Store in Supabase secrets/environment:

- Gemini API key
- Meta app secret
- Meta access tokens or references
- notification credentials

Never commit secrets.

## RLS

Enable Row Level Security on all organization/brand/content data.

## Meta Tokens

- do not expose client-side
- encrypt/store securely via server-side mechanism
- avoid printing tokens to logs
- refresh before expiration

## Uploads

- validate MIME types and max sizes
- generate unique storage paths
- use signed/private URLs where appropriate

## Abuse Controls

Add sensible generation rate limits and usage quotas, even for single-user MVP, to prevent accidental API cost spikes.
