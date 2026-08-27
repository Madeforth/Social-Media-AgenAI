-- Strategy, posts, versioned content and the AI generation audit trail.

create table public.content_strategies (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  strategy_json jsonb not null default '{}'::jsonb,
  starts_at date not null,
  ends_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_strategies_range_valid check (ends_at >= starts_at)
);

create index content_strategies_brand_id_starts_at_idx
  on public.content_strategies (brand_id, starts_at desc);

create trigger content_strategies_set_updated_at
  before update on public.content_strategies
  for each row
  execute function public.set_updated_at();

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  strategy_id uuid references public.content_strategies (id) on delete set null,
  status public.post_status not null default 'DRAFT',
  content_pillar text not null default '',
  objective text not null default '',
  concept_title text not null default '',
  visual_format public.visual_format,
  ui_asset_required boolean not null default false,
  -- Points at the post_versions row currently shown to the user. The foreign key
  -- is added after post_versions exists.
  current_version_id uuid,
  scheduled_at timestamptz,
  published_at timestamptz,
  instagram_post_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A post that claims to be scheduled must actually carry a time.
  constraint posts_scheduled_requires_time
    check (status <> 'SCHEDULED' or scheduled_at is not null),
  constraint posts_published_requires_time
    check (status <> 'PUBLISHED' or published_at is not null)
);

create index posts_brand_id_status_idx on public.posts (brand_id, status);
create index posts_brand_id_created_at_idx on public.posts (brand_id, created_at desc);
create index posts_scheduled_at_idx on public.posts (scheduled_at)
  where scheduled_at is not null;

create trigger posts_set_updated_at
  before update on public.posts
  for each row
  execute function public.set_updated_at();

-- Generated copy and creative metadata are never overwritten in place; each
-- revision appends a new version row.
create table public.post_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  version_number integer not null check (version_number > 0),
  headline text not null default '',
  supporting_copy text not null default '',
  caption text not null default '',
  cta text not null default '',
  hashtags jsonb not null default '[]'::jsonb,
  creative_direction text not null default '',
  generation_prompt text not null default '',
  -- Path inside the private `generated-images` bucket. Image binaries never
  -- live in PostgreSQL.
  image_storage_path text,
  created_by public.post_version_author not null default 'AI',
  model_name text,
  model_metadata jsonb,
  created_at timestamptz not null default now(),
  unique (post_id, version_number),
  constraint post_versions_hashtags_is_array check (jsonb_typeof(hashtags) = 'array')
);

create index post_versions_post_id_version_idx
  on public.post_versions (post_id, version_number desc);

alter table public.posts
  add constraint posts_current_version_id_fkey
  foreign key (current_version_id) references public.post_versions (id) on delete set null;

-- Audit row for every AI call. Prompts, outputs and model metadata are retained.
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  post_id uuid references public.posts (id) on delete set null,
  generation_type public.generation_type not null,
  provider text not null,
  model text not null,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb,
  estimated_cost numeric(12, 6),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  created_at timestamptz not null default now()
);

create index ai_generations_brand_id_created_at_idx
  on public.ai_generations (brand_id, created_at desc);
create index ai_generations_post_id_idx on public.ai_generations (post_id)
  where post_id is not null;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.content_strategies enable row level security;
alter table public.posts enable row level security;
alter table public.post_versions enable row level security;
alter table public.ai_generations enable row level security;

create policy content_strategies_select on public.content_strategies
  for select to authenticated
  using (public.can_read_brand(brand_id));

create policy content_strategies_write on public.content_strategies
  for all to authenticated
  using (public.can_write_brand(brand_id))
  with check (public.can_write_brand(brand_id));

create policy posts_select on public.posts
  for select to authenticated
  using (public.can_read_brand(brand_id));

create policy posts_write on public.posts
  for all to authenticated
  using (public.can_write_brand(brand_id))
  with check (public.can_write_brand(brand_id));

create policy post_versions_select on public.post_versions
  for select to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_versions.post_id
        and public.can_read_brand(p.brand_id)
    )
  );

create policy post_versions_write on public.post_versions
  for all to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_versions.post_id
        and public.can_write_brand(p.brand_id)
    )
  )
  with check (
    exists (
      select 1
      from public.posts p
      where p.id = post_versions.post_id
        and public.can_write_brand(p.brand_id)
    )
  );

-- AI audit rows are written only by Edge Functions using the service role, which
-- bypasses RLS. Clients may read their brand's history but never write it.
create policy ai_generations_select on public.ai_generations
  for select to authenticated
  using (public.can_read_brand(brand_id));

revoke all on public.content_strategies from anon;
revoke all on public.posts from anon;
revoke all on public.post_versions from anon;
revoke all on public.ai_generations from anon;

grant select, insert, update, delete on public.content_strategies to authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, update, delete on public.post_versions to authenticated;
grant select on public.ai_generations to authenticated;
