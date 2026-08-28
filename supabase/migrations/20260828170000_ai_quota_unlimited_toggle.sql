-- Lets an org owner/admin switch off their own hourly/daily/monthly AI
-- generation cap from Settings, and switch it back on. Scoped narrowly on
-- purpose: the client gets column-level UPDATE on `unlimited` alone, never on
-- hourly_limit/daily_limit/monthly_limit themselves — flipping this toggle
-- must never be a way to also raise a numeric limit.

alter table public.ai_quotas
  add column unlimited boolean not null default false;

-- private.ai_allowance keeps computing real usage (so the UI can always show
-- "N used"), but `allowed` short-circuits to true while unlimited is set.
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
    select q.hourly_limit, q.daily_limit, q.monthly_limit, q.unlimited
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
    quota.unlimited
      or (used.hourly < quota.hourly_limit
        and used.daily < quota.daily_limit
        and used.monthly < quota.monthly_limit)
  from used, quota;
$$;

-- ---------------------------------------------------------------------------
-- The one narrow write path: OWNER/ADMIN may flip `unlimited`, nothing else.
-- ---------------------------------------------------------------------------

create policy ai_quotas_toggle_unlimited on public.ai_quotas
  for update to authenticated
  using (
    private.has_organization_role(
      organization_id,
      array['OWNER', 'ADMIN']::public.organization_role[]
    )
  )
  with check (
    private.has_organization_role(
      organization_id,
      array['OWNER', 'ADMIN']::public.organization_role[]
    )
  );

-- Column-level grant is what actually keeps this narrow: an UPDATE statement
-- naming hourly_limit/daily_limit/monthly_limit is refused at the grant layer
-- regardless of what the RLS policy above would otherwise permit.
grant update (unlimited) on public.ai_quotas to authenticated;
