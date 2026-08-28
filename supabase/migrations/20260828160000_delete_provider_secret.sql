-- Removing a stored credential, not just the row that pointed at it.
--
-- Disconnecting an account deletes its `social_accounts` row, but the Vault
-- secret it referenced stayed behind — invisible, unreferenced and impossible to
-- reach through any interface. Reconnecting a few times would leave a small pile
-- of live credentials nobody could see or revoke.
--
-- Service role only, like its store and read counterparts. Deleting a secret is
-- not something a client should be able to ask for.

create or replace function private.delete_provider_secret(p_secret_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from vault.secrets where id = p_secret_id;
end;
$$;

create or replace function public.delete_provider_secret(p_secret_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.delete_provider_secret(p_secret_id);
end;
$$;

revoke execute on function private.delete_provider_secret(uuid) from public, anon, authenticated;
revoke execute on function public.delete_provider_secret(uuid) from public, anon, authenticated;
grant execute on function public.delete_provider_secret(uuid) to service_role;
