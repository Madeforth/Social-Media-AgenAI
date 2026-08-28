// `sync-instagram-profile`: reads what the connected account already looks like.
//
// The generator's only source of brand knowledge used to be Brand Brain, and a
// thin record meant the model guessed. The account itself is better evidence
// than a form: the bio states what the brand claims to be, and the recent
// captions show how it actually talks and what it has already said.
//
// Read-only, on demand. This is context for a prompt, not a live feed, so it is
// a snapshot the owner refreshes rather than a subscription.
//
// Same gate as every privileged function: verify the JWT, re-check membership
// through the caller's own session, read the token from Vault and never let it
// out. Everything fetched here is text written by other people, so it is stored
// as data and reaches the model inside the untrusted boundary.

import { createClient } from 'npm:@supabase/supabase-js@2';

import { isMetaAuthFailure, markSocialAccountExpired } from '../_shared/ai.ts';

const GRAPH_API_VERSION = 'v21.0';

/** Enough recent posts to show voice and catch repetition, without flooding the prompt. */
const MEDIA_LIMIT = 12;

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

  // Re-read the brand through the caller's own session; the id in the body is
  // an assertion, not a fact.
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
  if (!membership) return json(403, { error: 'not a member of this organization' });

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: account } = await serviceClient
    .from('social_accounts')
    .select('id, external_account_id, token_secret_ref')
    .eq('brand_id', brand.id)
    .eq('platform', 'INSTAGRAM')
    .maybeSingle();
  if (!account) return json(400, { error: 'no Instagram account is connected' });

  const { data: accessToken } = await serviceClient.rpc('read_provider_secret', {
    p_secret_id: account.token_secret_ref,
  });
  if (!accessToken) return json(500, { error: 'could not read the stored access token' });

  // 1. The profile. `biography` and `website` need instagram_basic, which the
  // connect flow already requires.
  let profile: Record<string, unknown>;
  try {
    const fields = 'id,username,biography,website,followers_count,media_count';
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.external_account_id}?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`,
    );
    profile = await response.json();
    if (!response.ok) {
      throw new Error(
        (profile as { error?: { message?: string } })?.error?.message ??
          `Graph API returned ${response.status}`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    // A dead token has to change the stored state, or the panel keeps saying
    // "connected" while nothing works.
    if (isMetaAuthFailure(message)) {
      await markSocialAccountExpired(serviceClient, account.id);
    }
    return json(502, { error: `Could not read the profile: ${message}` });
  }

  // 2. Recent posts. Captions are the useful part — they are how this brand
  // sounds when it is not being asked to describe itself.
  let media: Array<Record<string, unknown>> = [];
  try {
    const fields = 'id,caption,media_type,permalink,timestamp';
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.external_account_id}/media?fields=${fields}&limit=${MEDIA_LIMIT}&access_token=${encodeURIComponent(accessToken)}`,
    );
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? `Graph API returned ${response.status}`);
    }
    media = Array.isArray(payload.data) ? payload.data : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    if (isMetaAuthFailure(message)) {
      await markSocialAccountExpired(serviceClient, account.id);
    }
    return json(502, { error: `Could not read recent posts: ${message}` });
  }

  const toInt = (value: unknown) => (typeof value === 'number' ? value : null);

  const { error: updateError } = await serviceClient
    .from('social_accounts')
    .update({
      biography: typeof profile.biography === 'string' ? profile.biography : null,
      website: typeof profile.website === 'string' ? profile.website : null,
      followers_count: toInt(profile.followers_count),
      media_count: toInt(profile.media_count),
      profile_synced_at: new Date().toISOString(),
    })
    .eq('id', account.id);
  if (updateError) return json(500, { error: 'failed to save the profile snapshot' });

  if (media.length > 0) {
    const rows = media.map((item) => ({
      social_account_id: account.id,
      external_media_id: String(item.id),
      caption: typeof item.caption === 'string' ? item.caption : null,
      media_type: typeof item.media_type === 'string' ? item.media_type : null,
      permalink: typeof item.permalink === 'string' ? item.permalink : null,
      posted_at: typeof item.timestamp === 'string' ? item.timestamp : null,
      synced_at: new Date().toISOString(),
    }));

    // Upsert rather than replace: a caption edited on Instagram should update in
    // place, and a post deleted there should not silently drop the rest.
    const { error: mediaError } = await serviceClient
      .from('instagram_media')
      .upsert(rows, { onConflict: 'social_account_id,external_media_id' });
    if (mediaError) return json(500, { error: 'failed to save the recent posts' });
  }

  return json(200, {
    synced: true,
    username: profile.username ?? null,
    followers_count: toInt(profile.followers_count),
    media_synced: media.length,
    has_biography: typeof profile.biography === 'string' && profile.biography.length > 0,
  });
});
