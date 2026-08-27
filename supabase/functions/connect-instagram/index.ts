// `connect-instagram`: Milestone 9. V1 connection flow is a pasted long-lived
// access token rather than a full Meta OAuth consent screen — the token is
// validated against the Graph API before anything is stored, and it never
// touches a table `authenticated` can read (see
// supabase/migrations/20260827150000_provider_secrets.sql). Same
// verify-JWT / re-check-authorization gate shape as generate-post; connecting
// an account requires ADMIN or OWNER, not just EDITOR, since it grants
// publishing capability for the whole brand.

import { createClient } from 'npm:@supabase/supabase-js@2';

const ADMIN_ROLES = new Set(['OWNER', 'ADMIN']);
const GRAPH_API_VERSION = 'v21.0';
const LONG_LIVED_TOKEN_LIFETIME_MS = 60 * 24 * 60 * 60 * 1000; // Meta's stated ~60 days.

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

  let body: {
    brand_id?: unknown;
    account_name?: unknown;
    external_account_id?: unknown;
    access_token?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid JSON body' });
  }
  const brandId = typeof body.brand_id === 'string' ? body.brand_id : null;
  const accountName = typeof body.account_name === 'string' ? body.account_name.trim() : '';
  const externalAccountId =
    typeof body.external_account_id === 'string' ? body.external_account_id.trim() : '';
  const accessToken = typeof body.access_token === 'string' ? body.access_token.trim() : '';
  if (!brandId || !accountName || !externalAccountId || !accessToken) {
    return json(400, {
      error: 'brand_id, account_name, external_account_id and access_token are all required',
    });
  }

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
    return json(403, { error: 'only an organization owner or admin can connect an account' });
  }

  // Validate the token before storing anything.
  let verifiedUsername: string | null = null;
  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${externalAccountId}?fields=id,username&access_token=${encodeURIComponent(accessToken)}`,
    );
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? `Graph API returned ${response.status}`);
    }
    verifiedUsername = typeof payload.username === 'string' ? payload.username : null;
  } catch (error) {
    return json(400, {
      error: `Could not verify this token against the Instagram Graph API: ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    });
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: secretId, error: secretError } = await serviceClient.rpc('store_provider_secret', {
    p_secret: accessToken,
    p_name: `instagram:${externalAccountId}`,
  });
  if (secretError || !secretId) {
    return json(500, { error: 'failed to store the access token' });
  }

  const { error: upsertError } = await serviceClient.from('social_accounts').upsert(
    {
      brand_id: brandId,
      platform: 'INSTAGRAM',
      account_name: verifiedUsername ?? accountName,
      external_account_id: externalAccountId,
      token_secret_ref: secretId,
      status: 'CONNECTED',
      token_expires_at: new Date(Date.now() + LONG_LIVED_TOKEN_LIFETIME_MS).toISOString(),
    },
    { onConflict: 'brand_id,platform,external_account_id' },
  );
  if (upsertError) return json(500, { error: 'failed to save the connected account' });

  return json(200, { connected: true, account_name: verifiedUsername ?? accountName });
});
