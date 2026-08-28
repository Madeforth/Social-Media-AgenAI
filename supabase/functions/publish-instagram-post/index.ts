// `publish-instagram-post`: Milestone 9. Manually triggered ("Publish now")
// rather than cron-driven — see docs/SECURITY.md and
// memory-bank/userActionsNeeded.md for why automatic scheduled publishing
// isn't wired yet. Same gate shape as generate-post: verify JWT, re-check
// the caller's own role against the post's brand, then do the privileged
// work with the service role.

import { createClient } from 'npm:@supabase/supabase-js@2';

import { isMetaAuthFailure, markSocialAccountExpired } from '../_shared/ai.ts';

const WRITE_ROLES = new Set(['OWNER', 'ADMIN', 'EDITOR']);
const GRAPH_API_VERSION = 'v21.0';
const SIGNED_URL_TTL_SECONDS = 3600;
const CONTAINER_POLL_ATTEMPTS = 10;
const CONTAINER_POLL_DELAY_MS = 3000;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    .select('id, brand_id, status, scheduled_at, current_version_id')
    .eq('id', postId)
    .maybeSingle();
  if (!post || !post.current_version_id) return json(404, { error: 'post not found' });

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
  if (!membership || !WRITE_ROLES.has(membership.role)) {
    return json(403, { error: 'not permitted to publish for this brand' });
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const [{ data: version }, { data: account }] = await Promise.all([
    serviceClient
      .from('post_versions')
      .select('caption, image_storage_path')
      .eq('id', post.current_version_id)
      .maybeSingle(),
    serviceClient
      .from('social_accounts')
      .select('id, external_account_id, token_secret_ref, status')
      .eq('brand_id', brand.id)
      .eq('platform', 'INSTAGRAM')
      .eq('status', 'CONNECTED')
      .maybeSingle(),
  ]);

  if (!version?.image_storage_path) {
    return json(400, { error: 'this post has no generated image yet' });
  }
  if (!account) {
    return json(400, { error: 'no connected Instagram account for this brand' });
  }

  const notifyMembers = async (type: 'PUBLISH_SUCCEEDED' | 'PUBLISH_FAILED', body: string) => {
    const { data: members } = await serviceClient
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', brand.organization_id);
    if (!members || members.length === 0) return;
    await serviceClient.from('notifications').insert(
      members.map((member) => ({
        user_id: member.user_id,
        type,
        title: type === 'PUBLISH_SUCCEEDED' ? 'Post published to Instagram' : 'Publishing failed',
        body,
        payload: { post_id: postId },
      })),
    );
  };

  const recordFailure = async (message: string) => {
    await Promise.all([
      serviceClient.from('posts').update({ status: 'FAILED' }).eq('id', postId),
      serviceClient.from('publication_jobs').insert({
        post_id: postId,
        social_account_id: account.id,
        status: 'FAILED',
        scheduled_at: post.scheduled_at ?? new Date().toISOString(),
        attempt_count: 1,
        last_error: message,
      }),
      notifyMembers('PUBLISH_FAILED', message),
    ]);
  };

  const { data: signedUrlData, error: signedUrlError } = await serviceClient.storage
    .from('generated-images')
    .createSignedUrl(version.image_storage_path, SIGNED_URL_TTL_SECONDS);
  if (signedUrlError || !signedUrlData) {
    await recordFailure('failed to sign the generated image for upload');
    return json(500, { error: 'failed to prepare the image for publishing' });
  }

  const { data: accessToken } = await serviceClient.rpc('read_provider_secret', {
    p_secret_id: account.token_secret_ref,
  });
  if (!accessToken) {
    await recordFailure('the connected account has no readable access token');
    return json(500, { error: 'could not read the stored access token' });
  }

  await serviceClient.from('posts').update({ status: 'PUBLISHING' }).eq('id', postId);

  try {
    const containerResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.external_account_id}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: signedUrlData.signedUrl,
          caption: version.caption,
          access_token: accessToken,
        }),
      },
    );
    const containerPayload = await containerResponse.json();
    if (!containerResponse.ok || !containerPayload.id) {
      throw new Error(containerPayload?.error?.message ?? 'failed to create the media container');
    }
    const creationId = containerPayload.id as string;

    let ready = false;
    for (let attempt = 0; attempt < CONTAINER_POLL_ATTEMPTS; attempt++) {
      const statusResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${creationId}?fields=status_code&access_token=${encodeURIComponent(accessToken)}`,
      );
      const statusPayload = await statusResponse.json();
      if (statusPayload.status_code === 'FINISHED') {
        ready = true;
        break;
      }
      if (statusPayload.status_code === 'ERROR') {
        throw new Error('Instagram reported an error while processing the media container');
      }
      await sleep(CONTAINER_POLL_DELAY_MS);
    }
    if (!ready) throw new Error('timed out waiting for the media container to finish processing');

    const publishResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.external_account_id}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
      },
    );
    const publishPayload = await publishResponse.json();
    if (!publishResponse.ok || !publishPayload.id) {
      throw new Error(publishPayload?.error?.message ?? 'failed to publish the media container');
    }

    const publishedAt = new Date().toISOString();
    await Promise.all([
      serviceClient
        .from('posts')
        .update({
          status: 'PUBLISHED',
          published_at: publishedAt,
          instagram_post_id: publishPayload.id,
        })
        .eq('id', postId),
      serviceClient.from('publication_jobs').insert({
        post_id: postId,
        social_account_id: account.id,
        status: 'SUCCEEDED',
        scheduled_at: post.scheduled_at ?? publishedAt,
        attempt_count: 1,
        external_post_id: publishPayload.id,
      }),
      notifyMembers('PUBLISH_SUCCEEDED', `Instagram media id ${publishPayload.id}`),
    ]);

    return json(200, { post_id: postId, instagram_post_id: publishPayload.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown publishing error';
    // A dead token is the one failure the owner can act on, so record it as
    // state rather than leaving the account reading "connected" while every
    // publish fails.
    if (isMetaAuthFailure(message)) {
      await markSocialAccountExpired(serviceClient, account.id);
    }
    await recordFailure(message);
    return json(502, { error: message });
  }
});
