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
  using (owner_user_id = (select auth.uid()) or public.is_organization_member(id));

create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (owner_user_id = (select auth.uid()));

create policy organizations_update on public.organizations
  for update to authenticated
  using (public.has_organization_role(id, array['OWNER', 'ADMIN']::public.organization_role[]))
  with check (public.has_organization_role(id, array['OWNER', 'ADMIN']::public.organization_role[]));

create policy organizations_delete on public.organizations
  for delete to authenticated
  using (public.has_organization_role(id, array['OWNER']::public.organization_role[]));

create policy organization_members_select on public.organization_members
  for select to authenticated
  using (public.is_organization_member(organization_id));

create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (
    public.has_organization_role(
      organization_id,
      array['OWNER', 'ADMIN']::public.organization_role[]
    )
  );

create policy organization_members_update on public.organization_members
  for update to authenticated
  using (
    public.has_organization_role(
      organization_id,
      array['OWNER', 'ADMIN']::public.organization_role[]
    )
  )
  with check (
    public.has_organization_role(
      organization_id,
      array['OWNER', 'ADMIN']::public.organization_role[]
    )
  );

create policy organization_members_delete on public.organization_members
  for delete to authenticated
  using (
    public.has_organization_role(
      organization_id,
      array['OWNER', 'ADMIN']::public.organization_role[]
    )
  );

revoke all on public.organizations from anon;
revoke all on public.organization_members from anon;

grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
