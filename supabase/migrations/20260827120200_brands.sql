-- Brand Brain: the brand itself, its guidelines and its asset references.
-- Asset binaries live in Supabase Storage; only paths and metadata are stored here.

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  status public.brand_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create index brands_organization_id_idx on public.brands (organization_id);

create trigger brands_set_updated_at
  before update on public.brands
  for each row
  execute function public.set_updated_at();

-- One guideline row per brand. Structured fields stay jsonb so the Brand Brain
-- can evolve without a migration per field.
create table public.brand_guidelines (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null unique references public.brands (id) on delete cascade,
  mission text,
  vision text,
  positioning text,
  target_audience text,
  tone_of_voice jsonb,
  visual_rules jsonb,
  copy_rules jsonb,
  forbidden_claims jsonb not null default '[]'::jsonb,
  content_pillars jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_guidelines_forbidden_claims_is_array
    check (jsonb_typeof(forbidden_claims) = 'array'),
  constraint brand_guidelines_content_pillars_is_array
    check (jsonb_typeof(content_pillars) = 'array')
);

create trigger brand_guidelines_set_updated_at
  before update on public.brand_guidelines
  for each row
  execute function public.set_updated_at();

create table public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  asset_type public.brand_asset_type not null,
  name text not null check (length(trim(name)) > 0),
  -- Path inside the private `brand-assets` storage bucket, always prefixed with
  -- the brand id so storage policies can authorise on the first path segment.
  storage_path text not null check (length(storage_path) > 0),
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, storage_path)
);

create index brand_assets_brand_id_type_idx on public.brand_assets (brand_id, asset_type);

create trigger brand_assets_set_updated_at
  before update on public.brand_assets
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Brand access helpers
--
-- SECURITY DEFINER for the same reason as the organization helpers, and defined
-- after `brands` exists so the function body can be validated.
--
-- Role model: any member reads, EDITOR and above write content, ADMIN and above
-- administer the brand.
-- ---------------------------------------------------------------------------

create or replace function private.can_read_brand(p_brand_id uuid)
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

create or replace function private.can_write_brand(p_brand_id uuid)
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

create or replace function private.can_administer_brand(p_brand_id uuid)
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

revoke execute on function private.can_read_brand(uuid) from public, anon;
revoke execute on function private.can_write_brand(uuid) from public, anon;
revoke execute on function private.can_administer_brand(uuid) from public, anon;

grant execute on function private.can_read_brand(uuid) to authenticated;
grant execute on function private.can_write_brand(uuid) to authenticated;
grant execute on function private.can_administer_brand(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.brands enable row level security;
alter table public.brand_guidelines enable row level security;
alter table public.brand_assets enable row level security;

create policy brands_select on public.brands
  for select to authenticated
  using (private.is_organization_member(organization_id));

create policy brands_insert on public.brands
  for insert to authenticated
  with check (
    private.has_organization_role(
      organization_id,
      array['OWNER', 'ADMIN']::public.organization_role[]
    )
  );

create policy brands_update on public.brands
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

create policy brands_delete on public.brands
  for delete to authenticated
  using (
    private.has_organization_role(
      organization_id,
      array['OWNER']::public.organization_role[]
    )
  );

create policy brand_guidelines_select on public.brand_guidelines
  for select to authenticated
  using (private.can_read_brand(brand_id));

create policy brand_guidelines_write_insert on public.brand_guidelines
  for insert to authenticated
  with check (private.can_write_brand(brand_id));

create policy brand_guidelines_write_update on public.brand_guidelines
  for update to authenticated
  using (private.can_write_brand(brand_id))
  with check (private.can_write_brand(brand_id));

create policy brand_guidelines_write_delete on public.brand_guidelines
  for delete to authenticated
  using (private.can_write_brand(brand_id));

create policy brand_assets_select on public.brand_assets
  for select to authenticated
  using (private.can_read_brand(brand_id));

create policy brand_assets_write_insert on public.brand_assets
  for insert to authenticated
  with check (private.can_write_brand(brand_id));

create policy brand_assets_write_update on public.brand_assets
  for update to authenticated
  using (private.can_write_brand(brand_id))
  with check (private.can_write_brand(brand_id));

create policy brand_assets_write_delete on public.brand_assets
  for delete to authenticated
  using (private.can_write_brand(brand_id));

revoke all on public.brands from anon;
revoke all on public.brand_guidelines from anon;
revoke all on public.brand_assets from anon;

grant select, insert, update, delete on public.brands to authenticated;
grant select, insert, update, delete on public.brand_guidelines to authenticated;
grant select, insert, update, delete on public.brand_assets to authenticated;
