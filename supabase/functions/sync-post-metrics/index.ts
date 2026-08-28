// `sync-post-metrics`: Milestone 9. Manually triggered pull of Instagram
// insights for one already-published post. Same gate shape as the other
// functions in this project.

import { createClient } from 'npm:@supabase/supabase-js@2';

import { isMetaAuthFailure, markSocialAccountExpired } from '../_shared/ai.ts';

const GRAPH_API_VERSION = 'v21.0';
const METRICS = ['impressions', 'reach', 'likes', 'comments', 'saved', 'shares'] as const;

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

  let body: { post_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid JSON body' });
  }
  const postId = typeof body.post_id === 'string' ? body.post_id : null;
  if (!postId) return json(400, { error: 'post_id is required' });

  const { data: post } = await userClient
    .from('posts')
    .select('id, brand_id, instagram_post_id')
    .eq('id', postId)
    .maybeSingle();
  if (!post) return json(404, { error: 'post not found' });
  if (!post.instagram_post_id) return json(400, { error: 'this post has not been published yet' });

  const { data: brand } = await userClient
    .from('brands')
    .select('id, organization_id')
    .eq('id', post.brand_id)
    .maybeSingle();
  if (!brand) return json(404, { error: 'brand not found' });

  const { data: membership } = await userClient
    .from('organization_members')
    .select('role')
    .eq('organization_id', brand.organization_id)
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (!membership) return json(403, { error: 'not permitted to read this brand' });

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: account } = await serviceClient
    .from('social_accounts')
    .select('token_secret_ref')
    .eq('brand_id', brand.id)
    .eq('platform', 'INSTAGRAM')
    .eq('status', 'CONNECTED')
    .maybeSingle();
  if (!account) return json(400, { error: 'no connected Instagram account for this brand' });

  const { data: accessToken } = await serviceClient.rpc('read_provider_secret', {
    p_secret_id: account.token_secret_ref,
  });
  if (!accessToken) return json(500, { error: 'could not read the stored access token' });

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${post.instagram_post_id}/insights?metric=${METRICS.join(',')}&access_token=${encodeURIComponent(accessToken)}`,
    );
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? `Graph API returned ${response.status}`);
    }

    const values: Record<string, number> = {};
    for (const entry of payload.data ?? []) {
      const value = entry?.values?.[0]?.value;
      if (typeof value === 'number') values[entry.name] = value;
    }

    const { error: insertError } = await serviceClient.from('post_metrics').insert({
      post_id: postId,
      impressions: values.impressions ?? null,
      reach: values.reach ?? null,
      likes: values.likes ?? null,
      comments: values.comments ?? null,
      saves: values.saved ?? null,
      shares: values.shares ?? null,
      raw_metrics: payload,
    });
    if (insertError) throw new Error(insertError.message);

    return json(200, { post_id: postId, metrics: values });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown metrics error';
    if (isMetaAuthFailure(message)) {
      await markSocialAccountExpired(serviceClient, account.id);
    }
    return json(502, { error: message });
  }
});
