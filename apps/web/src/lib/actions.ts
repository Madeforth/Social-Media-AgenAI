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
        body: JSON.stringify({ brand_id: brand.id, brief: brief || undefined }),
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
