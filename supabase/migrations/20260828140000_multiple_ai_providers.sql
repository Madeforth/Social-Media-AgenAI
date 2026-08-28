-- Several AI provider connections per organization, and a routing choice.
--
-- Until now an organization had exactly one credential, keyed by provider, and
-- both text and image generation used it. That falls apart as soon as the best
-- text model and the best image model come from different companies — which is
-- the case here: Gemini writes the copy, Ideogram is being evaluated for the
-- design work.
--
-- So a connection is now a row a person creates and names, an organization may
-- hold several, and a separate routing row says which connection handles text
-- and which handles images.

create type public.ai_provider as enum ('GEMINI', 'IDEOGRAM');

-- The old unique (organization_id, provider) is exactly the assumption being
-- removed: two Gemini keys, one for a test project and one for production, is a
-- reasonable thing to want.
alter table public.ai_provider_keys
  drop constraint ai_provider_keys_organization_id_provider_key;

alter table public.ai_provider_keys
  add column label text;

-- Existing rows predate labels; name them after the provider they already are.
update public.ai_provider_keys set label = initcap(provider) where label is null;

alter table public.ai_provider_keys
  alter column label set not null,
  add constraint ai_provider_keys_label_not_blank check (length(trim(label)) > 0),
  add constraint ai_provider_keys_label_unique unique (organization_id, label);

alter table public.ai_provider_keys
  alter column provider type public.ai_provider using provider::public.ai_provider;

comment on column public.ai_provider_keys.label is
  'What the owner calls this connection, so two keys for the same provider stay distinguishable.';

-- ---------------------------------------------------------------------------
-- A ceiling on connections
-- ---------------------------------------------------------------------------

-- Enforced in the database rather than the form. Each connection holds a Vault
-- secret and appears in the routing dropdowns; an unbounded list is a mess to
-- reason about and a slow leak of secrets nobody is tracking.
create or replace function public.enforce_ai_provider_key_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing integer;
begin
  select count(*) into existing
  from public.ai_provider_keys
  where organization_id = new.organization_id;

  if existing >= 5 then
    raise exception 'an organization may hold at most 5 AI provider connections'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger ai_provider_keys_limit
  before insert on public.ai_provider_keys
  for each row
  execute function public.enforce_ai_provider_key_limit();

revoke execute on function public.enforce_ai_provider_key_limit() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Routing
-- ---------------------------------------------------------------------------

-- Kept in its own row rather than as a flag on the connection, so that "which
-- one writes the copy" is a single fact with a single writer, and deleting a
-- connection cannot leave two rows both claiming the job.
create table public.ai_routing (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  text_provider_key_id uuid references public.ai_provider_keys (id) on delete set null,
  image_provider_key_id uuid references public.ai_provider_keys (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ai_routing_set_updated_at
  before update on public.ai_routing
  for each row
  execute function public.set_updated_at();

comment on table public.ai_routing is
  'Which connection handles text and which handles images. Null falls back to the first usable connection.';

-- Deleting the connection a job pointed at nulls the reference rather than
-- cascading the routing row away, so the remaining choice survives.

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.ai_routing enable row level security;

-- Readable so Settings can show the current routing. Deliberately no client
-- write policy: changing it goes through an Edge Function, which is also where
-- the rule that text must point at a text-capable provider is enforced.
create policy ai_routing_select on public.ai_routing
  for select to authenticated
  using (private.is_organization_member(organization_id));

revoke all on public.ai_routing from anon, authenticated;
grant select on public.ai_routing to authenticated;
