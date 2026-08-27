import type {
  AppNotification,
  Brand,
  BrandAsset,
  BrandGuidelines,
  PostStatus,
  PostWithVersion,
  SocialAccount,
} from '@apex/types';
import { useEffect, useState } from 'react';

import { useAuth } from '@/auth/provider';

import { callFunction } from './functions';
import { getSupabaseClient } from './supabase';

/**
 * The single seam between the screens and their data source.
 *
 * Row Level Security is the only access boundary here: every query below is
 * scoped only by the signed-in user's session, and Postgres decides what rows
 * come back. `useCurrentBrand()` resolves the caller's earliest brand — V1 is
 * one implicit brand per organization, not a switcher between many.
 */
export interface Query<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

function resolved<T>(data: T): Query<T> {
  return { data, loading: false, error: null };
}

function toError(message: string | undefined): Error | null {
  return message ? new Error(message) : null;
}

export function useCurrentBrand(): Query<Brand | null> {
  const { session, loading: authLoading } = useAuth();
  const [state, setState] = useState<Query<Brand | null>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let active = true;
    setState((previous) => ({ ...previous, loading: true }));

    getSupabaseClient()
      .from('brands')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        setState({ data: data ?? null, loading: false, error: toError(error?.message) });
      });

    return () => {
      active = false;
    };
  }, [session, authLoading]);

  return state;
}

export function usePosts(): Query<PostWithVersion[]> & { refetch: () => void } {
  const brand = useCurrentBrand();
  const [state, setState] = useState<Query<PostWithVersion[]>>({
    data: [],
    loading: true,
    error: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (brand.loading) return;
    if (!brand.data) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    let active = true;
    setState((previous) => ({ ...previous, loading: true }));

    getSupabaseClient()
      .from('posts')
      .select('*, version:post_versions!posts_current_version_id_fkey(*)')
      .eq('brand_id', brand.data.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        const posts = (data ?? [])
          .filter((post) => Boolean(post.version))
          .map((post) => post as unknown as PostWithVersion);
        setState({ data: posts, loading: false, error: toError(error?.message) });
      });

    return () => {
      active = false;
    };
  }, [brand.loading, brand.data, refreshKey]);

  return { ...state, refetch: () => setRefreshKey((key) => key + 1) };
}

export function usePost(id: string): Query<PostWithVersion | null> & { refetch: () => void } {
  const posts = usePosts();
  return {
    ...posts,
    data: posts.data.find((post) => post.id === id) ?? null,
  };
}

export function useBrandGuidelines(): Query<BrandGuidelines | null> {
  const brand = useCurrentBrand();
  const [state, setState] = useState<Query<BrandGuidelines | null>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (brand.loading) return;
    if (!brand.data) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let active = true;
    setState((previous) => ({ ...previous, loading: true }));

    getSupabaseClient()
      .from('brand_guidelines')
      .select('*')
      .eq('brand_id', brand.data.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        setState({
          data: (data as unknown as BrandGuidelines) ?? null,
          loading: false,
          error: toError(error?.message),
        });
      });

    return () => {
      active = false;
    };
  }, [brand.loading, brand.data]);

  return state;
}

export function useBrandAssets(): Query<BrandAsset[]> {
  const brand = useCurrentBrand();
  const [state, setState] = useState<Query<BrandAsset[]>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (brand.loading) return;
    if (!brand.data) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    let active = true;
    setState((previous) => ({ ...previous, loading: true }));

    getSupabaseClient()
      .from('brand_assets')
      .select('*')
      .eq('brand_id', brand.data.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        setState({
          data: (data as unknown as BrandAsset[]) ?? [],
          loading: false,
          error: toError(error?.message),
        });
      });

    return () => {
      active = false;
    };
  }, [brand.loading, brand.data]);

  return state;
}

export function useSocialAccount(): Query<SocialAccount | null> {
  const brand = useCurrentBrand();
  const [state, setState] = useState<Query<SocialAccount | null>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (brand.loading) return;
    if (!brand.data) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let active = true;
    setState((previous) => ({ ...previous, loading: true }));

    getSupabaseClient()
      .from('social_accounts')
      .select(
        'id, brand_id, platform, account_name, external_account_id, status, token_expires_at, created_at, updated_at',
      )
      .eq('brand_id', brand.data.id)
      .eq('platform', 'INSTAGRAM')
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        setState({
          data: (data as unknown as SocialAccount) ?? null,
          loading: false,
          error: toError(error?.message),
        });
      });

    return () => {
      active = false;
    };
  }, [brand.loading, brand.data]);

  return state;
}

export function useGeminiKeyConnected(): Query<boolean> {
  const brand = useCurrentBrand();
  const [state, setState] = useState<Query<boolean>>({ data: false, loading: true, error: null });

  useEffect(() => {
    if (brand.loading) return;
    if (!brand.data) {
      setState({ data: false, loading: false, error: null });
      return;
    }

    let active = true;
    setState((previous) => ({ ...previous, loading: true }));

    getSupabaseClient()
      .from('ai_provider_keys')
      .select('id')
      .eq('organization_id', brand.data.organization_id)
      .eq('provider', 'GEMINI')
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        setState({ data: Boolean(data), loading: false, error: toError(error?.message) });
      });

    return () => {
      active = false;
    };
  }, [brand.loading, brand.data]);

  return state;
}

export function useNotifications(): Query<AppNotification[]> & { refetch: () => void } {
  const { session, loading: authLoading } = useAuth();
  const [state, setState] = useState<Query<AppNotification[]>>({
    data: [],
    loading: true,
    error: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    let active = true;
    setState((previous) => ({ ...previous, loading: true }));

    getSupabaseClient()
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!active) return;
        setState({
          data: (data as unknown as AppNotification[]) ?? [],
          loading: false,
          error: toError(error?.message),
        });
      });

    return () => {
      active = false;
    };
  }, [session, authLoading, refreshKey]);

  return { ...state, refetch: () => setRefreshKey((key) => key + 1) };
}

export async function markNotificationRead(id: string): Promise<void> {
  await getSupabaseClient()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
}

export async function markAllNotificationsRead(): Promise<void> {
  await getSupabaseClient()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);
}

/** Signed URL into the private `generated-images` bucket, or null if there is no image yet. */
export async function getPostImageUrl(storagePath: string | null): Promise<string | null> {
  if (!storagePath) return null;
  const { data } = await getSupabaseClient()
    .storage.from('generated-images')
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? null;
}

interface GenerateOptions {
  brief?: string;
  forcedContentPillar?: string;
  forcedVisualFormat?: string;
  language?: string;
  postId?: string;
}

/** Calls `generate-post`, same Edge Function web's Create page and Regenerate button use. */
export async function generatePost(
  session: Parameters<typeof callFunction>[0],
  brandId: string,
  options: GenerateOptions,
): Promise<{ postId: string | null; errorCode: string | null }> {
  const result = await callFunction<{ post_id?: string; error?: string }>(
    session,
    'generate-post',
    {
      brand_id: brandId,
      post_id: options.postId,
      brief: options.brief || undefined,
      forced_content_pillar: options.forcedContentPillar || undefined,
      forced_visual_format: options.forcedVisualFormat || undefined,
      language: options.language || undefined,
    },
  );
  if (result.ok && result.data?.post_id) return { postId: result.data.post_id, errorCode: null };
  const errorCode =
    result.status === 429 ? 'quota' : result.status === 503 ? 'not_configured' : 'failed';
  return { postId: null, errorCode };
}

export async function generateImage(
  session: Parameters<typeof callFunction>[0],
  postId: string,
): Promise<{ ok: boolean; errorCode: string | null }> {
  const result = await callFunction(session, 'generate-image', { post_id: postId });
  if (result.ok) return { ok: true, errorCode: null };
  const errorCode =
    result.status === 429 ? 'quota' : result.status === 503 ? 'not_configured' : 'failed';
  return { ok: false, errorCode };
}

export async function publishPost(
  session: Parameters<typeof callFunction>[0],
  postId: string,
): Promise<{ ok: boolean }> {
  const result = await callFunction(session, 'publish-instagram-post', { post_id: postId });
  return { ok: result.ok };
}

export async function syncMetrics(
  session: Parameters<typeof callFunction>[0],
  postId: string,
): Promise<void> {
  await callFunction(session, 'sync-post-metrics', { post_id: postId });
}

export async function connectInstagram(
  session: Parameters<typeof callFunction>[0],
  brandId: string,
  accountName: string,
  externalAccountId: string,
  accessToken: string,
): Promise<{ ok: boolean }> {
  const result = await callFunction(session, 'connect-instagram', {
    brand_id: brandId,
    account_name: accountName,
    external_account_id: externalAccountId,
    access_token: accessToken,
  });
  return { ok: result.ok };
}

export async function connectGemini(
  session: Parameters<typeof callFunction>[0],
  brandId: string,
  apiKey: string,
): Promise<{ ok: boolean }> {
  const result = await callFunction(session, 'connect-gemini', {
    brand_id: brandId,
    api_key: apiKey,
  });
  return { ok: result.ok };
}

export async function approvePost(postId: string): Promise<void> {
  await getSupabaseClient().from('posts').update({ status: 'APPROVED' }).eq('id', postId);
}

export async function requestRevision(postId: string): Promise<void> {
  await getSupabaseClient().from('posts').update({ status: 'REVISION' }).eq('id', postId);
}

export async function schedulePost(postId: string, scheduledAtIso: string): Promise<void> {
  await getSupabaseClient()
    .from('posts')
    .update({ status: 'SCHEDULED', scheduled_at: scheduledAtIso })
    .eq('id', postId);
}

export interface EditPostVersionInput {
  headline: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

/** Appends a new `created_by: 'USER'` version rather than overwriting one in place. */
export async function editPostVersion(
  postId: string,
  currentVersionId: string | null,
  input: EditPostVersionInput,
): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: currentVersion } = await supabase
    .from('post_versions')
    .select(
      'version_number, supporting_copy, creative_direction, generation_prompt, image_storage_path',
    )
    .eq('id', currentVersionId ?? '')
    .maybeSingle();

  const { data: inserted } = await supabase
    .from('post_versions')
    .insert({
      post_id: postId,
      version_number: (currentVersion?.version_number ?? 0) + 1,
      headline: input.headline,
      supporting_copy: currentVersion?.supporting_copy ?? '',
      caption: input.caption,
      cta: input.cta,
      hashtags: input.hashtags,
      creative_direction: currentVersion?.creative_direction ?? '',
      generation_prompt: currentVersion?.generation_prompt ?? '',
      image_storage_path: currentVersion?.image_storage_path ?? null,
      created_by: 'USER',
    })
    .select('id')
    .single();

  if (inserted) {
    await supabase
      .from('posts')
      .update({ current_version_id: inserted.id, status: 'READY' })
      .eq('id', postId);
  }
}

export async function updateBrand(
  brandId: string,
  name: string,
  description: string,
): Promise<void> {
  await getSupabaseClient()
    .from('brands')
    .update({ name, description: description || null })
    .eq('id', brandId);
}

export interface BrandGuidelinesInput {
  mission: string;
  vision: string;
  positioning: string;
  targetAudience: string;
  toneAttributes: string[];
  toneDo: string[];
  toneDont: string[];
  palette: string[];
  typography: string[];
  visualAvoid: string[];
  copyDo: string[];
  copyDont: string[];
  forbiddenClaims: string[];
  contentPillarsRaw: string;
}

export async function updateBrandGuidelines(
  brandId: string,
  input: BrandGuidelinesInput,
): Promise<void> {
  const contentPillars = input.contentPillarsRaw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = '', description = '', share = ''] = line.split('|').map((part) => part.trim());
      return {
        key: slugify(name) || 'pillar',
        name,
        description,
        target_share: Math.max(0, Math.min(1, (Number(share.replace('%', '')) || 0) / 100)),
      };
    });

  await getSupabaseClient()
    .from('brand_guidelines')
    .upsert(
      {
        brand_id: brandId,
        mission: input.mission.trim() || null,
        vision: input.vision.trim() || null,
        positioning: input.positioning.trim() || null,
        target_audience: input.targetAudience.trim() || null,
        tone_of_voice: { attributes: input.toneAttributes, do: input.toneDo, dont: input.toneDont },
        visual_rules: {
          palette: input.palette,
          typography: input.typography,
          composition: [],
          avoid: input.visualAvoid,
        },
        copy_rules: {
          language: 'tr',
          reading_level: 'general',
          do: input.copyDo,
          dont: input.copyDont,
        },
        forbidden_claims: input.forbiddenClaims,
        content_pillars: contentPillars,
      },
      { onConflict: 'brand_id' },
    );
}

/** `brands.slug` is `^[a-z0-9]+(-[a-z0-9]+)*$` — derive one from the brand name. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Creates one organization (the caller becomes its `OWNER` via the database
 * trigger) and one brand inside it — the mobile equivalent of the web
 * Settings form. RLS is the only gate; there is no server-action layer here.
 */
export async function createOrganizationAndBrand(
  brandName: string,
  ownerUserId: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();

  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: `${brandName}'s workspace`, owner_user_id: ownerUserId })
    .select('id')
    .single();

  if (orgError || !organization) return { error: orgError?.message ?? 'Unknown error' };

  const slug = slugify(brandName) || 'brand';
  const { error: brandError } = await supabase
    .from('brands')
    .insert({ organization_id: organization.id, name: brandName, slug });

  return { error: brandError?.message ?? null };
}

export interface DashboardSummary {
  plannedThisWeek: number;
  readyToApprove: number;
  scheduled: number;
  publishedThisMonth: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/** Counters derived from the posts themselves, never stored or estimated. */
export function summarise(posts: PostWithVersion[]): DashboardSummary {
  const now = Date.now();

  const within = (iso: string | null, span: number, past: boolean) => {
    if (!iso) return false;
    const at = new Date(iso).getTime();
    return past ? at <= now && at >= now - span : at >= now && at <= now + span;
  };

  return {
    plannedThisWeek: posts.filter(
      (post) => within(post.scheduled_at, WEEK_MS, false) || post.status === 'READY',
    ).length,
    readyToApprove: posts.filter((post) => post.status === 'READY').length,
    scheduled: posts.filter((post) => post.status === 'SCHEDULED').length,
    publishedThisMonth: posts.filter(
      (post) => post.status === 'PUBLISHED' && within(post.published_at, MONTH_MS, true),
    ).length,
  };
}

export function byStatus(posts: PostWithVersion[], status: PostStatus): PostWithVersion[] {
  return posts.filter((post) => post.status === status);
}

export function upcoming(posts: PostWithVersion[]): PostWithVersion[] {
  return posts
    .filter((post) => post.status === 'SCHEDULED' && post.scheduled_at !== null)
    .sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? ''));
}

export function approvalQueue(posts: PostWithVersion[]): PostWithVersion[] {
  return posts
    .filter((post) => post.status === 'READY')
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Anything on the calendar: published date if there is one, else the schedule. */
export function calendarDate(post: PostWithVersion): string | null {
  return post.published_at ?? post.scheduled_at;
}
