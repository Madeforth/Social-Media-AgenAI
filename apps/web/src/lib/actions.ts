'use server';

import { BRAND_ASSET_TYPES, type BrandAssetType } from '@apex/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { defaultLocale, hasLocale } from '@/i18n/config';

import { getCurrentUser } from './auth';
import { getCurrentBrand } from './data';
import { getServerSupabase } from './supabase-server';

function targetLocale(formData: FormData): string {
  const locale = String(formData.get('locale') ?? defaultLocale);
  return hasLocale(locale) ? locale : defaultLocale;
}

/** Splits a textarea into trimmed, non-empty lines — the list-editing convention this page uses. */
function lines(formData: FormData, key: string): string[] {
  return String(formData.get(key) ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/** `brands.slug` is `^[a-z0-9]+(-[a-z0-9]+)*$` — derive one from the brand name. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Creates one organization (the caller becomes its `OWNER` via the database
 * trigger) and one brand inside it. V1 is one implicit brand per
 * organization — this is the entire "brand selection" surface for now.
 */
export async function createOrganizationAndBrand(formData: FormData): Promise<void> {
  const brandName = String(formData.get('brandName') ?? '').trim();
  const locale = String(formData.get('locale') ?? defaultLocale);
  if (!brandName) return;

  const user = await getCurrentUser();
  if (!user) redirect(`/${hasLocale(locale) ? locale : defaultLocale}/sign-in`);

  const supabase = await getServerSupabase();

  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: `${brandName}'s workspace`, owner_user_id: user.id })
    .select('id')
    .single();

  if (orgError || !organization) return;

  const slug = slugify(brandName) || 'brand';
  await supabase.from('brands').insert({
    organization_id: organization.id,
    name: brandName,
    slug,
  });

  revalidatePath(`/${hasLocale(locale) ? locale : defaultLocale}`, 'layout');
}

/** Edits an existing brand's name/description in place — no version history, unlike posts. */
export async function updateBrand(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const brandId = String(formData.get('brandId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (!brandId || !name) redirect(`/${locale}/settings`);

  // Validated here as well as by the column's own check constraint. This value
  // is written by a user and ends up in published copy, so anything that is not
  // a plain http(s) URL — `javascript:` above all — is dropped rather than
  // stored and later echoed into a caption.
  const rawAppUrl = String(formData.get('appUrl') ?? '').trim();
  const appUrl = /^https?:\/\/[^\s]+$/i.test(rawAppUrl) ? rawAppUrl : null;

  const supabase = await getServerSupabase();
  await supabase
    .from('brands')
    .update({
      name,
      description: String(formData.get('description') ?? '').trim() || null,
      app_url: appUrl,
    })
    .eq('id', brandId);

  revalidatePath(`/${locale}`, 'layout');
  redirect(`/${locale}/settings`);
}

export async function signOutAction(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? defaultLocale);
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect(`/${hasLocale(locale) ? locale : defaultLocale}/sign-in`);
}

/**
 * Writes the Brand Brain form. List-shaped fields are one item per line in
 * their textarea; content pillars are `name | description | share%` per line
 * so the form stays a set of plain textareas rather than a repeating widget.
 */
export async function updateBrandGuidelines(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const brand = await getCurrentBrand();
  if (!brand) redirect(`/${locale}/brand-brain`);

  const supabase = await getServerSupabase();

  const contentPillars = lines(formData, 'contentPillars').map((line) => {
    const [name = '', description = '', share = ''] = line.split('|').map((part) => part.trim());
    return {
      key: slugify(name) || 'pillar',
      name,
      description,
      target_share: Math.max(0, Math.min(1, (Number(share.replace('%', '')) || 0) / 100)),
    };
  });

  const text = (key: string) => String(formData.get(key) ?? '').trim() || null;

  await supabase.from('brand_guidelines').upsert(
    {
      brand_id: brand.id,
      mission: text('mission'),
      vision: text('vision'),
      positioning: text('positioning'),
      target_audience: text('targetAudience'),
      tone_of_voice: {
        attributes: lines(formData, 'toneAttributes'),
        do: lines(formData, 'toneDo'),
        dont: lines(formData, 'toneDont'),
      },
      visual_rules: {
        palette: lines(formData, 'palette'),
        typography: lines(formData, 'typography'),
        composition: lines(formData, 'composition'),
        avoid: lines(formData, 'visualAvoid'),
      },
      copy_rules: {
        language: text('copyLanguage') ?? locale,
        reading_level: text('readingLevel') ?? 'general',
        do: lines(formData, 'copyDo'),
        dont: lines(formData, 'copyDont'),
      },
      forbidden_claims: lines(formData, 'forbiddenClaims'),
      content_pillars: contentPillars,
    },
    { onConflict: 'brand_id' },
  );

  revalidatePath(`/${locale}/brand-brain`, 'layout');
  redirect(`/${locale}/brand-brain`);
}

/** Uploads one file into the private `brand-assets` bucket and records its row. */
export async function uploadBrandAsset(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const brand = await getCurrentBrand();
  if (!brand) redirect(`/${locale}/assets`);

  const file = formData.get('file');
  const name = String(formData.get('name') ?? '').trim();
  const assetType = String(formData.get('assetType') ?? '');

  if (!(file instanceof File) || file.size === 0 || !name) redirect(`/${locale}/assets`);
  if (!BRAND_ASSET_TYPES.includes(assetType as BrandAssetType)) redirect(`/${locale}/assets`);

  const supabase = await getServerSupabase();
  const extension = file.name.includes('.') ? file.name.split('.').pop() : undefined;
  const path = `${brand.id}/${crypto.randomUUID()}${extension ? `.${extension}` : ''}`;

  const { error: uploadError } = await supabase.storage
    .from('brand-assets')
    .upload(path, file, { contentType: file.type || undefined });
  if (uploadError) redirect(`/${locale}/assets`);

  await supabase.from('brand_assets').insert({
    brand_id: brand.id,
    asset_type: assetType as BrandAssetType,
    name,
    storage_path: path,
  });

  revalidatePath(`/${locale}/assets`);
}

/**
 * Calls the `generate-post` Edge Function (docs/SECURITY.md's Milestone 6 gate)
 * with the caller's own access token, so the function re-verifies authorization
 * itself rather than trusting this server action's judgment.
 */
export async function generatePost(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const brand = await getCurrentBrand();
  if (!brand) redirect(`/${locale}/create`);

  const supabase = await getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  const brief = String(formData.get('brief') ?? '').trim();
  const forcedContentPillar = String(formData.get('contentPillar') ?? '').trim();
  const forcedVisualFormat = String(formData.get('visualFormat') ?? '').trim();
  const language = String(formData.get('language') ?? '').trim();
  const publishDate = String(formData.get('publishDate') ?? '').trim();

  let postId: string | null = null;
  let errorCode = 'failed';

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-post`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          brand_id: brand.id,
          brief: brief || undefined,
          forced_content_pillar: forcedContentPillar || undefined,
          forced_visual_format: forcedVisualFormat || undefined,
          language: language || undefined,
        }),
      },
    );
    const result = (await response.json()) as { post_id?: string; error?: string };
    if (response.ok && result.post_id) {
      postId = result.post_id;
    } else if (response.status === 429) {
      errorCode = 'quota';
    } else if (response.status === 503) {
      errorCode = 'not_configured';
    }
  } catch {
    errorCode = 'network';
  }

  if (postId) {
    if (publishDate) {
      const scheduledAt = new Date(`${publishDate}T09:00:00`);
      if (!Number.isNaN(scheduledAt.getTime())) {
        await supabase
          .from('posts')
          .update({ scheduled_at: scheduledAt.toISOString() })
          .eq('id', postId);
      }
    }
    revalidatePath(`/${locale}/library`, 'layout');
    redirect(`/${locale}/posts/${postId}`);
  }

  redirect(`/${locale}/create?error=${errorCode}`);
}

/** Calls the `generate-image` Edge Function for a post's current version. */
export async function generateImage(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const postId = String(formData.get('postId') ?? '');
  if (!postId) redirect(`/${locale}/library`);

  const supabase = await getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  let errorCode: string | null = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ post_id: postId }),
      },
    );
    if (!response.ok) {
      errorCode =
        response.status === 429 ? 'quota' : response.status === 503 ? 'not_configured' : 'failed';
    }
  } catch {
    errorCode = 'network';
  }

  revalidatePath(`/${locale}/posts/${postId}`);
  redirect(
    errorCode ? `/${locale}/posts/${postId}?imageError=${errorCode}` : `/${locale}/posts/${postId}`,
  );
}

/** Removes both the storage object and its row. Only ADMIN/OWNER can — RLS enforces it. */
export async function deleteBrandAsset(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const assetId = String(formData.get('assetId') ?? '');
  const storagePath = String(formData.get('storagePath') ?? '');
  if (!assetId) return;

  const supabase = await getServerSupabase();
  await supabase.from('brand_assets').delete().eq('id', assetId);
  if (storagePath) await supabase.storage.from('brand-assets').remove([storagePath]);

  revalidatePath(`/${locale}/assets`);
}

/**
 * Calls `generate-post` again with `post_id` set, so it appends a new version
 * to the existing post (Milestone 8's "Regenerate") instead of creating one.
 */
export async function regeneratePost(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const postId = String(formData.get('postId') ?? '');
  if (!postId) redirect(`/${locale}/library`);

  const supabase = await getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  const brief = String(formData.get('brief') ?? '').trim();
  let errorCode: string | null = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-post`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ post_id: postId, brief: brief || undefined }),
      },
    );
    if (!response.ok) {
      errorCode =
        response.status === 429 ? 'quota' : response.status === 503 ? 'not_configured' : 'failed';
    }
  } catch {
    errorCode = 'network';
  }

  revalidatePath(`/${locale}/posts/${postId}`);
  revalidatePath(`/${locale}/library`, 'layout');
  redirect(
    errorCode ? `/${locale}/posts/${postId}?genError=${errorCode}` : `/${locale}/posts/${postId}`,
  );
}

/** Sets a post's status directly. Every transition here is still gated by the posts RLS policy. */
async function setPostStatus(
  postId: string,
  status: 'APPROVED' | 'REVISION' | 'CANCELLED',
): Promise<void> {
  const supabase = await getServerSupabase();
  await supabase.from('posts').update({ status }).eq('id', postId);
}

export async function approvePost(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const postId = String(formData.get('postId') ?? '');
  if (!postId) return;
  await setPostStatus(postId, 'APPROVED');
  revalidatePath(`/${locale}/posts/${postId}`);
  revalidatePath(`/${locale}/library`, 'layout');
}

export async function requestRevision(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const postId = String(formData.get('postId') ?? '');
  if (!postId) return;
  await setPostStatus(postId, 'REVISION');
  revalidatePath(`/${locale}/posts/${postId}`);
  revalidatePath(`/${locale}/library`, 'layout');
}

/** `scheduledAt` is a `datetime-local` value (no timezone) — treated as the brand's local time. */
export async function schedulePost(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const postId = String(formData.get('postId') ?? '');
  const scheduledAt = String(formData.get('scheduledAt') ?? '');
  if (!postId || !scheduledAt) return;

  const at = new Date(scheduledAt);
  if (Number.isNaN(at.getTime())) return;

  const supabase = await getServerSupabase();
  await supabase
    .from('posts')
    .update({ status: 'SCHEDULED', scheduled_at: at.toISOString() })
    .eq('id', postId);

  revalidatePath(`/${locale}/posts/${postId}`);
  revalidatePath(`/${locale}/calendar`, 'layout');
  revalidatePath(`/${locale}/library`, 'layout');
}

/**
 * A human edit never overwrites a version in place — it appends a new one
 * (`created_by: 'USER'`) and moves `current_version_id`, carrying over the
 * image and creative direction from the version being edited.
 */
export async function editPostVersion(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const postId = String(formData.get('postId') ?? '');
  if (!postId) redirect(`/${locale}/library`);

  const supabase = await getServerSupabase();

  const { data: post } = await supabase
    .from('posts')
    .select('id, current_version_id')
    .eq('id', postId)
    .maybeSingle();
  if (!post) redirect(`/${locale}/library`);

  const { data: currentVersion } = await supabase
    .from('post_versions')
    .select('version_number, creative_direction, generation_prompt, image_storage_path')
    .eq('id', post.current_version_id ?? '')
    .maybeSingle();

  const { data: inserted, error: insertError } = await supabase
    .from('post_versions')
    .insert({
      post_id: postId,
      version_number: (currentVersion?.version_number ?? 0) + 1,
      headline: String(formData.get('headline') ?? '').trim(),
      supporting_copy: String(formData.get('supportingCopy') ?? '').trim(),
      caption: String(formData.get('caption') ?? '').trim(),
      cta: String(formData.get('cta') ?? '').trim(),
      hashtags: lines(formData, 'hashtags'),
      creative_direction: currentVersion?.creative_direction ?? '',
      generation_prompt: currentVersion?.generation_prompt ?? '',
      image_storage_path: currentVersion?.image_storage_path ?? null,
      created_by: 'USER',
    })
    .select('id')
    .single();
  if (insertError || !inserted) redirect(`/${locale}/posts/${postId}`);

  await supabase
    .from('posts')
    .update({ current_version_id: inserted.id, status: 'READY' })
    .eq('id', postId);

  revalidatePath(`/${locale}/posts/${postId}`);
  revalidatePath(`/${locale}/library`, 'layout');
  redirect(`/${locale}/posts/${postId}`);
}

/**
 * Posts one configuration change to the `ai-providers` Edge Function.
 *
 * Everything about providers goes through that one endpoint, which is where the
 * key is verified, the five-connection ceiling is applied and the rule that only
 * Gemini can generate text is enforced. Nothing here touches the tables.
 */
async function callAiProviders(
  body: Record<string, unknown>,
  locale: string,
): Promise<string | null> {
  const brand = await getCurrentBrand();
  if (!brand) redirect(`/${locale}/settings`);

  const supabase = await getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-providers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ brand_id: brand.id, ...body }),
      },
    );
    if (response.ok) return null;

    // Surface what the provider actually said. A generic "could not save" has
    // cost real time three times over: a retired model id, a validation limit
    // four characters short, and an Ideogram key that authenticates fine but has
    // no credits behind it. The specific sentence is the whole diagnosis.
    const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
    const message = typeof payload?.error === 'string' ? payload.error : 'failed';
    return message.slice(0, 300);
  } catch {
    return 'network';
  }
}

function providerRedirect(locale: string, errorMessage: string | null): never {
  revalidatePath(`/${locale}/settings`);
  redirect(
    errorMessage
      ? `/${locale}/settings?providerError=${encodeURIComponent(errorMessage)}`
      : `/${locale}/settings?providerSaved=1`,
  );
}

/** Adds one named provider connection. The key is verified before it is stored. */
export async function addAiProvider(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const errorCode = await callAiProviders(
    {
      action: 'add',
      provider: String(formData.get('provider') ?? '').trim(),
      label: String(formData.get('label') ?? '').trim(),
      api_key: String(formData.get('apiKey') ?? '').trim(),
    },
    locale,
  );
  providerRedirect(locale, errorCode);
}

/** Removes a connection. Any routing that pointed at it is nulled by the database. */
export async function deleteAiProvider(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const errorCode = await callAiProviders(
    { action: 'delete', connection_id: String(formData.get('connectionId') ?? '') },
    locale,
  );
  providerRedirect(locale, errorCode);
}

/** Chooses which connection writes copy and which one draws. */
export async function setAiRouting(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const errorCode = await callAiProviders(
    {
      action: 'route',
      text_provider_key_id: String(formData.get('textProvider') ?? '') || null,
      image_provider_key_id: String(formData.get('imageProvider') ?? '') || null,
    },
    locale,
  );
  providerRedirect(locale, errorCode);
}

/** Sets the model, or for Ideogram the rendering speed, on one connection. */
export async function setConnectionModels(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const errorCode = await callAiProviders(
    {
      action: 'set_models',
      connection_id: String(formData.get('connectionId') ?? ''),
      text_model: String(formData.get('textModel') ?? '').trim(),
      image_model: String(formData.get('imageModel') ?? '').trim(),
    },
    locale,
  );
  providerRedirect(locale, errorCode);
}

/** Validates and stores a pasted long-lived Instagram access token (Milestone 9, V1 connect flow). */
export async function connectInstagram(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const brand = await getCurrentBrand();
  if (!brand) redirect(`/${locale}/settings`);

  const supabase = await getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  let errorCode: string | null = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/connect-instagram`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          brand_id: brand.id,
          account_name: String(formData.get('accountName') ?? '').trim(),
          external_account_id: String(formData.get('externalAccountId') ?? '').trim(),
          access_token: String(formData.get('accessToken') ?? '').trim(),
        }),
      },
    );
    if (!response.ok) errorCode = 'failed';
  } catch {
    errorCode = 'network';
  }

  revalidatePath(`/${locale}/settings`);
  redirect(
    errorCode ? `/${locale}/settings?igError=${errorCode}` : `/${locale}/settings?igConnected=1`,
  );
}

/** Calls `publish-instagram-post` for an approved/scheduled post ("Publish now"). */
export async function publishPost(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const postId = String(formData.get('postId') ?? '');
  if (!postId) return;

  const supabase = await getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  let errorCode: string | null = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/publish-instagram-post`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ post_id: postId }),
      },
    );
    if (!response.ok) errorCode = 'failed';
  } catch {
    errorCode = 'network';
  }

  revalidatePath(`/${locale}/posts/${postId}`);
  revalidatePath(`/${locale}/library`, 'layout');
  revalidatePath(`/${locale}/calendar`, 'layout');
  redirect(
    errorCode
      ? `/${locale}/posts/${postId}?publishError=${errorCode}`
      : `/${locale}/posts/${postId}`,
  );
}

/** Calls `sync-post-metrics` for one published post. */
export async function syncMetrics(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const postId = String(formData.get('postId') ?? '');
  if (!postId) return;

  const supabase = await getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  try {
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-post-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ post_id: postId }),
    });
  } catch {
    // Best-effort: the analytics page just keeps showing the last synced value.
  }

  revalidatePath(`/${locale}/posts/${postId}`);
  revalidatePath(`/${locale}/analytics`, 'layout');
}

export async function markNotificationRead(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);
  const notificationId = String(formData.get('notificationId') ?? '');
  if (!notificationId) return;

  const supabase = await getServerSupabase();
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  revalidatePath(`/${locale}`, 'layout');
}

export async function markAllNotificationsRead(formData: FormData): Promise<void> {
  const locale = targetLocale(formData);

  const supabase = await getServerSupabase();
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);

  revalidatePath(`/${locale}`, 'layout');
}
