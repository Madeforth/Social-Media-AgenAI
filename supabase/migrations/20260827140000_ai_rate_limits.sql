-- Cost control for the Gemini runtime.
--
-- A generation request is the only expensive operation in the product, and the
-- bill is paid per call. Limits are therefore enforced in the database rather
-- than in application code: an Edge Function bug, a retry storm or a stolen
-- session cannot spend more than the organization's allowance.
--
-- Limits are configuration, not user data. Clients may read them so the UI can
-- explain why a request was refused, but no client policy grants a write —
-- only the service role can raise a limit.

create table public.ai_quotas (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  hourly_limit integer not null default 20 check (hourly_limit >= 0),
  daily_limit integer not null default 100 check (daily_limit >= 0),
  monthly_limit integer not null default 1000 check (monthly_limit >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ai_quotas_set_updated_at
  before update on public.ai_quotas
  for each row
  execute function public.set_updated_at();

-- Every organization gets an allowance the moment it exists. Without this an
-- organization created before a quota row would be unlimited by omission.
create or replace function public.add_default_ai_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.ai_quotas (organization_id)
  values (new.id)
  on conflict (organization_id) do nothing;
  return new;
end;
$$;

create trigger organizations_add_ai_quota
  after insert on public.organizations
  for each row
  execute function public.add_default_ai_quota();

revoke execute on function public.add_default_ai_quota() from public, anon, authenticated;

-- Backfill any organization that already exists.
insert into public.ai_quotas (organization_id)
select id from public.organizations
on conflict (organization_id) do nothing;

-- ---------------------------------------------------------------------------
-- Allowance calculation
-- ---------------------------------------------------------------------------

-- Counted from `ai_generations`, which is the audit trail of every call that was
-- actually made. There is no separate counter to drift out of sync.
create or replace function private.ai_allowance(p_brand_id uuid)
returns table (
  hourly_used integer,
  hourly_limit integer,
  daily_used integer,
  daily_limit integer,
  monthly_used integer,
  monthly_limit integer,
  allowed boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with org as (
    select b.organization_id
    from public.brands b
    where b.id = p_brand_id
  ),
  quota as (
    select q.hourly_limit, q.daily_limit, q.monthly_limit
    from public.ai_quotas q
    join org on org.organization_id = q.organization_id
  ),
  used as (
    select
      count(*) filter (where g.created_at >= now() - interval '1 hour')::integer as hourly,
      count(*) filter (where g.created_at >= now() - interval '1 day')::integer as daily,
      count(*) filter (where g.created_at >= now() - interval '30 days')::integer as monthly
    from public.ai_generations g
    join public.brands b on b.id = g.brand_id
    join org on org.organization_id = b.organization_id
  )
  select
    used.hourly,
    quota.hourly_limit,
    used.daily,
    quota.daily_limit,
    used.monthly,
    quota.monthly_limit,
    used.hourly < quota.hourly_limit
      and used.daily < quota.daily_limit
      and used.monthly < quota.monthly_limit
  from used, quota;
$$;

-- PostgREST does not expose the `private` schema at all, which is the point —
-- but Edge Functions reach the database through PostgREST too. This wrapper is
-- the one door into the allowance calculation, and only the service role holds
-- EXECUTE on it, so a signed-in user calling the endpoint is refused.
create or replace function public.ai_allowance(p_brand_id uuid)
returns table (
  hourly_used integer,
  hourly_limit integer,
  daily_used integer,
  daily_limit integer,
  monthly_used integer,
  monthly_limit integer,
  allowed boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from private.ai_allowance(p_brand_id);
$$;

revoke execute on function public.ai_allowance(uuid) from public, anon, authenticated;
grant execute on function public.ai_allowance(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.ai_quotas enable row level security;

-- Readable so the UI can say "you have used 18 of 20 generations this hour".
-- Deliberately no insert, update or delete policy: a client must never be able
-- to raise its own spending limit.
create policy ai_quotas_select on public.ai_quotas
  for select to authenticated
  using (private.is_organization_member(organization_id));

revoke all on public.ai_quotas from anon, authenticated;
grant select on public.ai_quotas to authenticated;
