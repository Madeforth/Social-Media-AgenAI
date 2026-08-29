-- Creative Engine V2: machine-readable Brand Brain extension, per-run
-- candidates and audit trail. Additive only — every existing generate-image
-- V1 column and table is untouched, and V2 stays behind the
-- CREATIVE_ENGINE_V2_ENABLED application flag until proven.

alter table public.brand_guidelines
  add column if not exists creative_profile jsonb not null default '{}'::jsonb;

alter table public.post_versions
  add column if not exists creative_plan jsonb,
  add column if not exists generation_manifest jsonb,
  add column if not exists visual_qa jsonb;

create table if not exists public.creative_runs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  post_version_id uuid not null references public.post_versions (id) on delete cascade,
  status text not null default 'PLANNED'
    check (status in ('PLANNED', 'GENERATING', 'RENDERING', 'REVIEWING', 'PASSED', 'REVIEW_REQUIRED', 'FAILED')),
  request_json jsonb not null,
  plan_json jsonb,
  selected_candidate_id uuid,
  failure_json jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.creative_candidates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.creative_runs (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  ordinal smallint not null check (ordinal between 1 and 8),
  scene_storage_path text not null,
  final_storage_path text,
  provider text not null,
  api_version text not null check (api_version in ('v3', 'v4')),
  rendering_speed text not null,
  seed bigint,
  prompt_hash text not null check (prompt_hash ~ '^[a-f0-9]{64}$'),
  manifest_json jsonb,
  visual_qa jsonb,
  deterministic_failures jsonb not null default '[]'::jsonb,
  selected boolean not null default false,
  created_at timestamptz not null default now(),
  unique (run_id, ordinal)
);

alter table public.creative_runs
  drop constraint if exists creative_runs_selected_candidate_id_fkey;
alter table public.creative_runs
  add constraint creative_runs_selected_candidate_id_fkey
  foreign key (selected_candidate_id) references public.creative_candidates (id) on delete set null;

create unique index if not exists creative_candidates_one_selected_per_run_idx
  on public.creative_candidates (run_id) where selected;
create index if not exists creative_runs_brand_created_idx
  on public.creative_runs (brand_id, created_at desc);
create index if not exists creative_candidates_run_score_idx
  on public.creative_candidates (run_id, ((visual_qa->>'overall')::int) desc)
  where visual_qa ? 'overall';

alter table public.creative_runs enable row level security;
alter table public.creative_candidates enable row level security;

create policy creative_runs_select on public.creative_runs
  for select to authenticated using (private.can_read_brand(brand_id));
create policy creative_candidates_select on public.creative_candidates
  for select to authenticated using (private.can_read_brand(brand_id));

-- Mutations are service-role only. Users may review candidates but cannot
-- forge scores, manifests or the selected flag from a client.
revoke all on public.creative_runs from anon;
revoke all on public.creative_candidates from anon;
grant select on public.creative_runs to authenticated;
grant select on public.creative_candidates to authenticated;

comment on column public.brand_guidelines.creative_profile is
  'Versioned machine-readable Brand Brain: visual identity, layout recipes, platform geometry, provider policy and QA thresholds. Complements the existing free-text visual_rules column rather than replacing it.';
comment on table public.creative_candidates is
  'Every generated scene/final pair for Creative Engine V2, including rejects; image bytes stay in Storage.';
