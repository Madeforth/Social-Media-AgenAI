-- Social connections, publication jobs, ingested metrics and notifications.
-- Everything that touches a provider token is written only by Edge Functions
-- running with the service role.

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  platform public.social_platform not null,
  account_name text not null,
  external_account_id text not null,
  -- Reference to a server-side secret, never the token itself. Clients are not
  -- granted SELECT on this column.
  token_secret_ref text not null,
  status public.social_account_status not null default 'DISCONNECTED',
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, platform, external_account_id)
);

create index social_accounts_brand_id_idx on public.social_accounts (brand_id);

create trigger social_accounts_set_updated_at
  before update on public.social_accounts
  for each row
  execute function public.set_updated_at();

-- Publishing is always a server-side job with explicit state transitions.
-- A client action never publishes directly.
create table public.publication_jobs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  social_account_id uuid not null references public.social_accounts (id) on delete restrict,
  status public.publication_job_status not null default 'PENDING',
  scheduled_at timestamptz not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  external_post_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The cron worker claims due jobs through this index.
create index publication_jobs_due_idx on public.publication_jobs (scheduled_at)
  where status = 'PENDING';
create index publication_jobs_post_id_idx on public.publication_jobs (post_id);

create trigger publication_jobs_set_updated_at
  before update on public.publication_jobs
  for each row
  execute function public.set_updated_at();

create table public.post_metrics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  captured_at timestamptz not null default now(),
  impressions bigint,
  reach bigint,
  likes bigint,
  comments bigint,
  saves bigint,
  shares bigint,
  profile_visits bigint,
  raw_metrics jsonb,
  unique (post_id, captured_at)
);

create index post_metrics_post_id_captured_at_idx
  on public.post_metrics (post_id, captured_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);
create index notifications_user_id_unread_idx on public.notifications (user_id)
  where read_at is null;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.social_accounts enable row level security;
alter table public.publication_jobs enable row level security;
alter table public.post_metrics enable row level security;
alter table public.notifications enable row level security;

create policy social_accounts_select on public.social_accounts
  for select to authenticated
  using (private.can_read_brand(brand_id));

-- Connecting and disconnecting an account happens through an Edge Function, but
-- an admin may remove a stale row directly.
create policy social_accounts_delete on public.social_accounts
  for delete to authenticated
  using (private.can_administer_brand(brand_id));

create policy publication_jobs_select on public.publication_jobs
  for select to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = publication_jobs.post_id
        and private.can_read_brand(p.brand_id)
    )
  );

create policy post_metrics_select on public.post_metrics
  for select to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_metrics.post_id
        and private.can_read_brand(p.brand_id)
    )
  );

create policy notifications_select on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Marking a notification read is the only client-side write.
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.social_accounts from anon, authenticated;
revoke all on public.publication_jobs from anon;
revoke all on public.post_metrics from anon;
revoke all on public.notifications from anon;

-- token_secret_ref is deliberately excluded: the reference never reaches a client.
grant select (
  id,
  brand_id,
  platform,
  account_name,
  external_account_id,
  status,
  token_expires_at,
  created_at,
  updated_at
) on public.social_accounts to authenticated;
grant delete on public.social_accounts to authenticated;

grant select on public.publication_jobs to authenticated;
grant select on public.post_metrics to authenticated;
grant select, update on public.notifications to authenticated;
