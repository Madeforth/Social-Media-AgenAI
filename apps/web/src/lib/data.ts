import type {
  AppNotification,
  Brand,
  BrandAsset,
  BrandGuidelines,
  PostStatus,
  PostVersion,
  PostWithVersion,
  SocialAccount,
} from '@apex/types';

import { getServerSupabase } from './supabase-server';

/**
 * The single seam between the screens and their data source.
 *
 * Row Level Security is the only access boundary here: every query below is
 * scoped only by the signed-in user's session, and Postgres decides what rows
 * come back. `getCurrentBrand()` picks the caller's earliest brand — V1 is one
 * implicit brand per organization, not a switcher between many.
 */

export async function getCurrentBrand(): Promise<Brand | null> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function listPosts(): Promise<PostWithVersion[]> {
  const brand = await getCurrentBrand();
  if (!brand) return [];

  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from('posts')
    .select('*, version:post_versions!posts_current_version_id_fkey(*)')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false });

  return (data ?? [])
    .filter((post): post is typeof post & { version: NonNullable<typeof post.version> } =>
      Boolean(post.version),
    )
    .map((post) => ({ ...post, version: post.version as unknown as PostVersion }));
}

export async function getPost(id: string): Promise<PostWithVersion | null> {
  const posts = await listPosts();
  return posts.find((post) => post.id === id) ?? null;
}

export async function getBrandGuidelines(): Promise<BrandGuidelines | null> {
  const brand = await getCurrentBrand();
  if (!brand) return null;

  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from('brand_guidelines')
    .select('*')
    .eq('brand_id', brand.id)
    .maybeSingle();

  return (data as unknown as BrandGuidelines) ?? null;
}

/** Whether this brand's organization has connected its own Gemini API key. */

export interface AiConnection {
  id: string;
  provider: 'GEMINI' | 'IDEOGRAM';
  label: string;
  text_model: string | null;
  image_model: string | null;
  created_at: string;
}

export interface AiProviderState {
  connections: AiConnection[];
  routing: { text_provider_key_id: string | null; image_provider_key_id: string | null };
  limit: number;
  providers: Array<'GEMINI' | 'IDEOGRAM'>;
  ideogram_rendering_speeds: string[];
  defaults: { text_model: string; image_model: string };
}

async function callAiProviders<T>(body: Record<string, unknown>): Promise<T | null> {
  const brand = await getCurrentBrand();
  if (!brand) return null;

  const supabase = await getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

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
        cache: 'no-store',
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export interface AiConnectionWithModels extends AiConnection {
  /** What this specific key can reach. Empty when the lookup failed. */
  available: { text: string[]; image: string[] };
}

export interface AiProviderStateWithModels extends Omit<AiProviderState, 'connections'> {
  connections: AiConnectionWithModels[];
}

/** Every AI connection this organization holds, and which one does which job. */
export interface AiQuotaStatus {
  hourlyLimit: number;
  dailyLimit: number;
  monthlyLimit: number;
  unlimited: boolean;
}

/** Read-only: the client can flip `unlimited` (see actions.ts) but never the numeric limits. */
export async function getAiQuotaStatus(): Promise<AiQuotaStatus | null> {
  const brand = await getCurrentBrand();
  if (!brand) return null;

  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from('ai_quotas')
    .select('hourly_limit, daily_limit, monthly_limit, unlimited')
    .eq('organization_id', brand.organization_id)
    .maybeSingle();

  if (!data) return null;
  return {
    hourlyLimit: data.hourly_limit,
    dailyLimit: data.daily_limit,
    monthlyLimit: data.monthly_limit,
    unlimited: data.unlimited,
  };
}

export async function getAiProviderState(): Promise<AiProviderState | null> {
  return callAiProviders<AiProviderState>({ action: 'list' });
}

/**
 * The same, with each connection's reachable models attached.
 *
 * Listed live per connection rather than from a constant, because Google retires
 * model ids without warning — `gemini-2.5-pro` went to 404 mid-flight — and a
 * dropdown built from a stale list offers a model that fails on use. One lookup
 * per connection, run in parallel; a connection whose lookup fails still renders
 * with its saved choice intact.
 */
export async function getAiProviderStateWithModels(): Promise<AiProviderStateWithModels | null> {
  const state = await getAiProviderState();
  if (!state) return null;

  const connections = await Promise.all(
    state.connections.map(async (connection) => ({
      ...connection,
      available: (await getConnectionModels(connection.id)) ?? { text: [], image: [] },
    })),
  );

  return { ...state, connections };
}

/**
 * The models one connection can reach.
 *
 * Fetched per connection rather than for all of them, because each Gemini
 * lookup is a network call and only the routed connections have their model
 * shown as a choice.
 */
export async function getConnectionModels(
  connectionId: string,
): Promise<{ text: string[]; image: string[] } | null> {
  return callAiProviders<{ text: string[]; image: string[] }>({
    action: 'models',
    connection_id: connectionId,
  });
}

/** The brand's connected Instagram account, if any. Never selects `token_secret_ref`. */
export async function getSocialAccount(): Promise<SocialAccount | null> {
  const brand = await getCurrentBrand();
  if (!brand) return null;

  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from('social_accounts')
    .select(
      // Named column by column, never `*`: `token_secret_ref` has no client
      // grant, and selecting everything is refused outright.
      'id, brand_id, platform, account_name, external_account_id, status, token_expires_at, created_at, updated_at, biography, website, followers_count, media_count, profile_synced_at',
    )
    .eq('brand_id', brand.id)
    .eq('platform', 'INSTAGRAM')
    .maybeSingle();

  return (data as SocialAccount) ?? null;
}

/** Signed URL into the private `generated-images` bucket, or null if there is no image yet. */
export async function getPostImageUrl(storagePath: string | null): Promise<string | null> {
  if (!storagePath) return null;
  const supabase = await getServerSupabase();
  const { data } = await supabase.storage
    .from('generated-images')
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? null;
}

export async function listBrandAssets(): Promise<BrandAsset[]> {
  const brand = await getCurrentBrand();
  if (!brand) return [];

  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false });

  return (data as unknown as BrandAsset[]) ?? [];
}

export interface AnalyticsSummary {
  connected: boolean;
  hasMetrics: boolean;
  impressions: number;
  reach: number;
  engagement: number;
  /** Instagram's media insights have no per-post profile-visit metric — always unavailable. */
  profileVisits: null;
}

/**
 * Sums each published post's most recent metrics snapshot. `post_metrics` is
 * a time series (one row per sync), so summing every row would double-count
 * — only the latest row per post is kept before the totals are added.
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const brand = await getCurrentBrand();
  if (!brand) {
    return {
      connected: false,
      hasMetrics: false,
      impressions: 0,
      reach: 0,
      engagement: 0,
      profileVisits: null,
    };
  }

  const supabase = await getServerSupabase();
  const [{ data: account }, { data: rows }] = await Promise.all([
    supabase
      .from('social_accounts')
      .select('status')
      .eq('brand_id', brand.id)
      .eq('platform', 'INSTAGRAM')
      .eq('status', 'CONNECTED')
      .maybeSingle(),
    supabase
      .from('post_metrics')
      .select(
        'post_id, captured_at, impressions, reach, likes, comments, saves, shares, posts!inner(brand_id)',
      )
      .eq('posts.brand_id', brand.id)
      .order('captured_at', { ascending: false }),
  ]);

  type MetricsRow = NonNullable<typeof rows>[number];
  const latestByPost = new Map<string, MetricsRow>();
  for (const row of rows ?? []) {
    if (!latestByPost.has(row.post_id)) latestByPost.set(row.post_id, row);
  }

  let impressions = 0;
  let reach = 0;
  let engagement = 0;
  for (const row of latestByPost.values()) {
    impressions += row.impressions ?? 0;
    reach += row.reach ?? 0;
    engagement += (row.likes ?? 0) + (row.comments ?? 0) + (row.saves ?? 0) + (row.shares ?? 0);
  }

  return {
    connected: Boolean(account),
    hasMetrics: latestByPost.size > 0,
    impressions,
    reach,
    engagement,
    profileVisits: null,
  };
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
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const posts = await listPosts();
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

export async function listPostsByStatus(status: PostStatus): Promise<PostWithVersion[]> {
  const posts = await listPosts();
  return posts.filter((post) => post.status === status);
}

export async function listUpcomingPosts(): Promise<PostWithVersion[]> {
  const posts = await listPosts();
  return posts
    .filter((post) => post.status === 'SCHEDULED' && post.scheduled_at !== null)
    .sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? ''));
}

export async function listApprovalQueue(): Promise<PostWithVersion[]> {
  const posts = await listPosts();
  return posts
    .filter((post) => post.status === 'READY')
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listNotifications(): Promise<AppNotification[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return (data as unknown as AppNotification[]) ?? [];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await getServerSupabase();
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  return count ?? 0;
}
