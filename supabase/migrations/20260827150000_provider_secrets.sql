-- Milestone 9: a place to store a provider access token without ever putting
-- the token itself in a table `authenticated` can query. Supabase Vault
-- (the `vault` schema, backed by pgsodium) encrypts the secret at rest;
-- `social_accounts.token_secret_ref` stores only the vault row's id.
--
-- Both wrappers below mirror the `ai_allowance` pattern in
-- 20260827140000_ai_rate_limits.sql: a `private` SECURITY DEFINER function
-- holding the real logic, and a `public` wrapper that only `service_role`
-- may execute, since `private` itself has no PostgREST surface at all.

create extension if not exists supabase_vault with schema vault;

create or replace function private.store_provider_secret(p_secret text, p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from vault.secrets where name = p_name;
  if v_id is not null then
    perform vault.update_secret(v_id, p_secret);
    return v_id;
  end if;
  return vault.create_secret(p_secret, p_name);
end;
$$;

create or replace function private.read_provider_secret(p_secret_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where id = p_secret_id;
$$;

revoke execute on function private.store_provider_secret(text, text) from public, anon, authenticated;
revoke execute on function private.read_provider_secret(uuid) from public, anon, authenticated;

create or replace function public.store_provider_secret(p_secret text, p_name text)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select private.store_provider_secret(p_secret, p_name);
$$;

create or replace function public.read_provider_secret(p_secret_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select private.read_provider_secret(p_secret_id);
$$;

revoke execute on function public.store_provider_secret(text, text) from public, anon, authenticated;
revoke execute on function public.read_provider_secret(uuid) from public, anon, authenticated;
grant execute on function public.store_provider_secret(text, text) to service_role;
grant execute on function public.read_provider_secret(uuid) to service_role;
