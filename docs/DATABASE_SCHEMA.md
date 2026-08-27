# Database Schema — Initial Proposal

## organizations

- id uuid pk
- name text
- owner_user_id uuid
- created_at timestamptz

## organization_members

- organization_id uuid fk
- user_id uuid fk
- role text

## brands

- id uuid pk
- organization_id uuid fk
- name text
- slug text
- description text
- status text
- created_at timestamptz
- updated_at timestamptz

## brand_guidelines

- id uuid pk
- brand_id uuid fk
- mission text
- vision text
- positioning text
- target_audience text
- tone_of_voice jsonb
- visual_rules jsonb
- copy_rules jsonb
- forbidden_claims jsonb
- content_pillars jsonb
- updated_at timestamptz

## brand_assets

- id uuid pk
- brand_id uuid fk
- asset_type text
- name text
- storage_path text
- metadata jsonb
- created_at timestamptz

## social_accounts

- id uuid pk
- brand_id uuid fk
- platform text
- account_name text
- external_account_id text
- token_secret_ref text
- status text
- created_at timestamptz

## content_strategies

- id uuid pk
- brand_id uuid fk
- title text
- strategy_json jsonb
- starts_at date
- ends_at date
- created_at timestamptz

## posts

- id uuid pk
- brand_id uuid fk
- strategy_id uuid nullable fk
- status text
- content_pillar text
- objective text
- concept_title text
- visual_format text
- ui_asset_required boolean
- current_version_id uuid nullable
- scheduled_at timestamptz nullable
- published_at timestamptz nullable
- instagram_post_id text nullable
- created_at timestamptz
- updated_at timestamptz

## post_versions

- id uuid pk
- post_id uuid fk
- version_number int
- headline text
- supporting_copy text
- caption text
- cta text
- hashtags jsonb
- creative_direction text
- generation_prompt text
- image_storage_path text nullable
- created_by text
- model_name text nullable
- model_metadata jsonb
- created_at timestamptz

## ai_generations

- id uuid pk
- brand_id uuid fk
- post_id uuid nullable fk
- generation_type text
- provider text
- model text
- input_json jsonb
- output_json jsonb
- estimated_cost numeric nullable
- duration_ms int nullable
- created_at timestamptz

## publication_jobs

- id uuid pk
- post_id uuid fk
- social_account_id uuid fk
- status text
- scheduled_at timestamptz
- attempt_count int
- last_error text nullable
- external_post_id text nullable
- created_at timestamptz
- updated_at timestamptz

## post_metrics

- id uuid pk
- post_id uuid fk
- captured_at timestamptz
- impressions bigint nullable
- reach bigint nullable
- likes bigint nullable
- comments bigint nullable
- saves bigint nullable
- shares bigint nullable
- profile_visits bigint nullable
- raw_metrics jsonb

## notifications

- id uuid pk
- user_id uuid fk
- type text
- title text
- body text
- read_at timestamptz nullable
- payload jsonb
- created_at timestamptz

## RLS

Every organization-scoped table must be protected by Row Level Security. Access should derive from membership in `organization_members`.

---

## Implementation Notes (Milestone 2)

The migrations in `supabase/migrations/` implement the proposal above with the
following deliberate refinements. `packages/types/src/database.ts` mirrors them.

### Enums instead of free text

`role`, `status`, `asset_type`, `visual_format`, `generation_type`,
`platform`, `publication_job_status` and `notification_type` are PostgreSQL
enums, not `text`. The canonical post statuses are then enforced by the database
rather than by convention, and any change requires an intentional migration.

### Added columns

- `organizations.updated_at`, `brand_guidelines.created_at`,
  `brand_assets.updated_at`, `content_strategies.updated_at` — every mutable
  table carries both timestamps, maintained by the `set_updated_at()` trigger.
- `social_accounts.token_expires_at` — needed by the token refresh job.

### Nullability

`posts.visual_format` is nullable: a `DRAFT` post exists before Gemini has
chosen a format. The remaining strategy fields default to empty strings so the
column stays non-null.

### Access helpers

RLS policies call four `SECURITY DEFINER` functions rather than inlining joins:
`is_organization_member`, `has_organization_role`, `can_read_brand`,
`can_write_brand` and `can_administer_brand`. They are `SECURITY DEFINER` so a
policy on `organization_members` can ask about membership without re-entering
that table's own policy, which would recurse. None of them accepts a user id —
the acting user always comes from `auth.uid()`.

Role model: any member reads, `EDITOR` and above write content, `ADMIN` and
above manage brands and organizations, `OWNER` deletes.

### Server-only writes

`ai_generations`, `publication_jobs` and `post_metrics` have no client write
policy. They are written by Edge Functions using the service role, which bypasses
RLS. `social_accounts.token_secret_ref` is excluded from the `authenticated`
column grant, so the reference never reaches a client at all.

### Storage

Two private buckets: `brand-assets` (user uploads) and `generated-images`
(Gemini output, written server-side only). Object keys are always
`<brand_id>/<...>`; policies authorise on the first path segment via
`public.storage_object_brand_id(name)`, which returns null rather than raising on
a malformed key.
