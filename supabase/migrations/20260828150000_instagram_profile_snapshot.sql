-- What the connected Instagram account already looks like.
--
-- Until now the only thing the generator knew about a brand was what someone had
-- typed into Brand Brain. When that is thin the model fills the gap by guessing,
-- and it guessed wrong in a way that was visible: a brand whose description says
-- motorcycles got a poster of a bicycle.
--
-- The account itself is a better source than a form, because it is what the brand
-- has actually published. The bio says what it claims to be, and the recent
-- captions say how it talks. Both are read through the token already stored for
-- publishing, and both are refreshed on demand rather than kept live — this is
-- context for a prompt, not a feed.
--
-- Everything here is text written by other people on the internet. It reaches the
-- model inside the untrusted-content boundary, never as instructions.

alter table public.social_accounts
  add column biography text,
  add column website text,
  add column followers_count integer,
  add column media_count integer,
  add column profile_synced_at timestamptz;

comment on column public.social_accounts.biography is
  'The account bio as Instagram reports it. Untrusted text: brand context for a prompt, never an instruction.';

create table public.instagram_media (
  id uuid primary key default gen_random_uuid(),
  social_account_id uuid not null references public.social_accounts (id) on delete cascade,
  external_media_id text not null,
  caption text,
  media_type text,
  permalink text,
  posted_at timestamptz,
  synced_at timestamptz not null default now(),
  unique (social_account_id, external_media_id)
);

create index instagram_media_account_posted_idx
  on public.instagram_media (social_account_id, posted_at desc);

comment on table public.instagram_media is
  'A snapshot of what the account has already published, used as brand context and to avoid repeating a recent post.';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.instagram_media enable row level security;

-- Readable by members so the UI can show what was synced. No client write
-- policy: rows come from the Graph API through an Edge Function using the
-- service role, and a client that could forge them could feed the model
-- whatever it liked.
create policy instagram_media_select on public.instagram_media
  for select to authenticated
  using (
    exists (
      select 1
      from public.social_accounts sa
      where sa.id = instagram_media.social_account_id
        and private.can_read_brand(sa.brand_id)
    )
  );

revoke all on public.instagram_media from anon, authenticated;
grant select on public.instagram_media to authenticated;

-- The new social_accounts columns need an explicit grant: that table is granted
-- column by column so `token_secret_ref` stays unreadable, and a column added
-- later inherits nothing.
grant select (biography, website, followers_count, media_count, profile_synced_at)
  on public.social_accounts to authenticated;
