-- Lets an org owner/admin paste their own Gemini API key from the UI instead
-- of a project owner running `supabase secrets set`. Same storage shape as
-- social_accounts.token_secret_ref: the key itself never sits in a table,
-- only a Vault secret id does (see 20260827150000_provider_secrets.sql).

create table public.ai_provider_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null,
  secret_ref uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create trigger ai_provider_keys_set_updated_at
  before update on public.ai_provider_keys
  for each row
  execute function public.set_updated_at();

alter table public.ai_provider_keys enable row level security;

-- Readable so the UI can say "connected"; the secret_ref is a Vault row id,
-- not a token, but there is still no reason a client needs to read it, so it
-- is excluded from the grant the same way social_accounts excludes its ref.
create policy ai_provider_keys_select on public.ai_provider_keys
  for select to authenticated
  using (private.is_organization_member(organization_id));

revoke all on public.ai_provider_keys from anon, authenticated;
grant select (id, organization_id, provider, created_at, updated_at)
  on public.ai_provider_keys to authenticated;
