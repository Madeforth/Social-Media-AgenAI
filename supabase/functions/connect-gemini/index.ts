// `connect-gemini`: lets an org owner/admin paste their own Gemini API key
// from Settings instead of a project owner running `supabase secrets set`.
// Same shape as connect-instagram: verify the key against the real API
// before storing anything, then store only a Vault secret id
// (supabase/migrations/20260828090000_ai_provider_keys.sql), never the key
// itself, in a table.

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

  let body: { brand_id?: unknown; api_key?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid JSON body' });
  }
  const brandId = typeof body.brand_id === 'string' ? body.brand_id : null;
  const apiKey = typeof body.api_key === 'string' ? body.api_key.trim() : '';
  if (!brandId || !apiKey) return json(400, { error: 'brand_id and api_key are both required' });

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
    return json(403, { error: 'only an organization owner or admin can connect a Gemini key' });
  }

  // Validate the key before storing anything — a cheap, read-only call.
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error?.message ?? `Gemini API returned ${response.status}`);
    }
  } catch (error) {
    return json(400, {
      error: `Could not verify this key against the Gemini API: ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    });
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: secretId, error: secretError } = await serviceClient.rpc('store_provider_secret', {
    p_secret: apiKey,
    p_name: `gemini:${brand.organization_id}`,
  });
  if (secretError || !secretId) {
    return json(500, { error: 'failed to store the API key' });
  }

  const { error: upsertError } = await serviceClient
    .from('ai_provider_keys')
    .upsert(
      { organization_id: brand.organization_id, provider: 'GEMINI', secret_ref: secretId },
      { onConflict: 'organization_id,provider' },
    );
  if (upsertError) return json(500, { error: 'failed to save the connected key' });

  return json(200, { connected: true });
});
