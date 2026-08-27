-- Foundations shared by every later migration: domain enums, the updated_at
-- trigger and the SECURITY DEFINER helpers that RLS policies are built on.

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

-- ---------------------------------------------------------------------------
-- Access helpers
--
-- These are SECURITY DEFINER so that a policy on organization_members can ask
-- about membership without re-entering that table's own RLS policy, which would
-- recurse. They are STABLE and read-only, and they never accept a user id from
-- the caller — the acting user always comes from auth.uid().
-- ---------------------------------------------------------------------------

create or replace function public.is_organization_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_organization_role(
  p_organization_id uuid,
  p_roles public.organization_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.role = any (p_roles)
  );
$$;

create or replace function public.can_read_brand(p_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.brands b
    join public.organization_members m on m.organization_id = b.organization_id
    where b.id = p_brand_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.can_write_brand(p_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.brands b
    join public.organization_members m on m.organization_id = b.organization_id
    where b.id = p_brand_id
      and m.user_id = (select auth.uid())
      and m.role in ('OWNER', 'ADMIN', 'EDITOR')
  );
$$;

create or replace function public.can_administer_brand(p_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.brands b
    join public.organization_members m on m.organization_id = b.organization_id
    where b.id = p_brand_id
      and m.user_id = (select auth.uid())
      and m.role in ('OWNER', 'ADMIN')
  );
$$;

revoke execute on function public.is_organization_member(uuid) from public, anon;
revoke execute on function public.has_organization_role(uuid, public.organization_role[])
  from public, anon;
revoke execute on function public.can_read_brand(uuid) from public, anon;
revoke execute on function public.can_write_brand(uuid) from public, anon;
revoke execute on function public.can_administer_brand(uuid) from public, anon;

grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.has_organization_role(uuid, public.organization_role[])
  to authenticated;
grant execute on function public.can_read_brand(uuid) to authenticated;
grant execute on function public.can_write_brand(uuid) to authenticated;
grant execute on function public.can_administer_brand(uuid) to authenticated;
