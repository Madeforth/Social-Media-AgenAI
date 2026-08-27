-- Foundations shared by every later migration: the `private` schema, the domain
-- enums and the updated_at trigger function.
--
-- The SECURITY DEFINER access helpers that RLS policies call are NOT here. A
-- `language sql` function body is validated when the function is created, so a
-- helper cannot be created before the table it reads. Each helper is defined in
-- the migration that creates its table.

-- ---------------------------------------------------------------------------
-- Private schema
--
-- RLS helper functions live here rather than in `public`. PostgREST only exposes
-- `public`, so a helper in `private` cannot be called as an RPC endpoint, while
-- policies can still call it: policy expressions are evaluated with the calling
-- role's privileges, which is why `authenticated` needs USAGE on the schema.
-- ---------------------------------------------------------------------------

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Enums — these mirror the string unions exported from @apex/types.
-- Changing a value here requires a matching change in packages/types.
-- ---------------------------------------------------------------------------

create type public.organization_role as enum ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

create type public.brand_status as enum ('ACTIVE', 'ARCHIVED');

create type public.brand_asset_type as enum (
  'LOGO',
  'PRODUCT_UI',
  'PRODUCT_IMAGE',
  'BADGE',
  'LIFESTYLE',
  'STYLE_REFERENCE'
);

create type public.post_status as enum (
  'DRAFT',
  'GENERATING',
  'READY',
  'REVISION',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHING',
  'PUBLISHED',
  'FAILED',
  'CANCELLED'
);

create type public.visual_format as enum (
  'PRODUCT_UI',
  'CINEMATIC_LIFESTYLE',
  'RIDER_COMMUNITY',
  'EDITORIAL_TYPOGRAPHY',
  'DATA_VISUALIZATION',
  'EDUCATIONAL_CAROUSEL',
  'ACHIEVEMENT_BADGE',
  'TEASER_LAUNCH',
  'MANIFESTO',
  'SEASONAL'
);

create type public.post_version_author as enum ('AI', 'USER');

create type public.generation_type as enum (
  'CONTENT_PLAN',
  'POST_PROPOSAL',
  'POST_REGENERATION',
  'IMAGE',
  'QA_REVIEW'
);

create type public.social_platform as enum ('INSTAGRAM');

create type public.social_account_status as enum (
  'CONNECTED',
  'EXPIRED',
  'DISCONNECTED',
  'ERROR'
);

create type public.publication_job_status as enum (
  'PENDING',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED'
);

create type public.notification_type as enum (
  'APPROVAL_REQUIRED',
  'PUBLISH_SUCCEEDED',
  'PUBLISH_FAILED'
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger function that stamps updated_at on every UPDATE.';
