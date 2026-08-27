-- Organizations and membership. Every other table in the schema derives its
-- access from a row in organization_members.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  owner_user_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_owner_user_id_idx on public.organizations (owner_user_id);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row
  execute function public.set_updated_at();

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.organization_role not null default 'EDITOR',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members (user_id);

-- The creator of an organization must immediately become its OWNER, otherwise
-- the insert policy below would lock them out of the row they just created.
create or replace function public.add_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.owner_user_id, 'OWNER')
  on conflict (organization_id, user_id) do nothing;
  return new;
end;
$$;

create trigger organizations_add_owner
  after insert on public.organizations
  for each row
  execute function public.add_organization_owner();

-- Only the trigger may run it. Without this revoke, PostgREST exposes a
-- SECURITY DEFINER function at /rest/v1/rpc/add_organization_owner.
revoke execute on function public.add_organization_owner() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Access helpers
--
-- These are SECURITY DEFINER so that a policy on organization_members can ask
-- about membership without re-entering that table's own RLS policy, which would
-- recurse. They are STABLE and read-only, and they never accept a user id from
-- the caller — the acting user always comes from auth.uid().
--
-- They are defined here, after the table exists: a `language sql` body is
-- validated at creation time and cannot reference a table that is not there yet.
-- ---------------------------------------------------------------------------

create or replace function private.is_organization_member(p_organization_id uuid)
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

create or replace function private.has_organization_role(
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

revoke execute on function private.is_organization_member(uuid) from public, anon;
revoke execute on function private.has_organization_role(uuid, public.organization_role[])
  from public, anon;

grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.has_organization_role(uuid, public.organization_role[])
  to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- The owner check is not redundant: INSERT ... RETURNING evaluates the SELECT
-- policy, and at that moment the AFTER trigger has not yet written the OWNER
-- membership row.
create policy organizations_select on public.organizations
  for select to authenticated
  using (owner_user_id = (select auth.uid()) or private.is_organization_member(id));

create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (owner_user_id = (select auth.uid()));

create policy organizations_update on public.organizations
  for update to authenticated
  using (private.has_organization_role(id, array['OWNER', 'ADMIN']::public.organization_role[]))
  with check (private.has_organization_role(id, array['OWNER', 'ADMIN']::public.organization_role[]));

create policy organizations_delete on public.organizations
  for delete to authenticated
  using (private.has_organization_role(id, array['OWNER']::public.organization_role[]));

create policy organization_members_select on public.organization_members
  for select to authenticated
  using (private.is_organization_member(organization_id));

create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (
    private.has_organization_role(
      organization_id,
      array['OWNER', 'ADMIN']::public.organization_role[]
    )
  );

create policy organization_members_update on public.organization_members
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

create policy organization_members_delete on public.organization_members
  for delete to authenticated
  using (
    private.has_organization_role(
      organization_id,
      array['OWNER', 'ADMIN']::public.organization_role[]
    )
  );

revoke all on public.organizations from anon;
revoke all on public.organization_members from anon;

grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
