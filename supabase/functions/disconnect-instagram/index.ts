// `disconnect-instagram`: removes a connected account and the credential behind it.
//
// There was no way to do this at all. The connect form only appeared when no
// account existed, so once one was stored — even with a token that had since
// expired — it could not be replaced from the interface.
//
// This is an Edge Function rather than a direct delete, even though RLS already
// lets an admin delete the row, because the row is only half of what is stored.
// The other half is a Vault secret that nothing else references and no interface
// can reach; deleting the row alone would leave live credentials behind on every
// reconnect.
//
// Same gate as the rest: verify the JWT, re-check membership through the
// caller's own session, and require OWNER or ADMIN — disconnecting removes the
// brand's ability to publish.

import { createClient } from 'npm:@supabase/supabase-js@2';

const ADMIN_ROLES = new Set(['OWNER', 'ADMIN']);

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: 'Supabase environment is not configured' });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json(401, { error: 'missing Authorization header' });

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json(401, { error: 'not authenticated' });

  let body: { brand_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid JSON body' });
  }
  const brandId = typeof body.brand_id === 'string' ? body.brand_id : null;
  if (!brandId) return json(400, { error: 'brand_id is required' });

  const { data: brand } = await userClient
    .from('brands')
    .select('id, organization_id')
    .eq('id', brandId)
    .maybeSingle();
  if (!brand) return json(404, { error: 'brand not found' });

  const { data: membership } = await userClient
    .from('organization_members')
    .select('role')
    .eq('organization_id', brand.organization_id)
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (!membership || !ADMIN_ROLES.has(membership.role)) {
    return json(403, { error: 'only an organization owner or admin can disconnect an account' });
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: account } = await serviceClient
    .from('social_accounts')
    .select('id, token_secret_ref')
    .eq('brand_id', brand.id)
    .eq('platform', 'INSTAGRAM')
    .maybeSingle();
  if (!account) return json(200, { disconnected: true });

  // Row first. If the secret delete then fails the account is already gone, and
  // an orphaned secret is a smaller problem than a row pointing at a secret that
  // no longer exists.
  const { error: deleteError } = await serviceClient
    .from('social_accounts')
    .delete()
    .eq('id', account.id);
  if (deleteError) return json(500, { error: 'failed to disconnect the account' });

  if (account.token_secret_ref) {
    await serviceClient.rpc('delete_provider_secret', { p_secret_id: account.token_secret_ref });
  }

  return json(200, { disconnected: true });
});
