import type {
  Brand,
  BrandAsset,
  BrandGuidelines,
  PostStatus,
  PostVersion,
  PostWithVersion,
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
