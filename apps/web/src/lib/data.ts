import type { Brand, BrandAsset, BrandGuidelines, PostStatus, PostWithVersion } from '@apex/types';

/**
 * The single seam between the screens and their data source.
 *
 * Supabase is not provisioned yet, so every reader returns an empty result and
 * the screens render their empty states. When the project exists, only the
 * bodies here change — no screen has to be rewritten, and no screen has ever
 * been shown data that did not come from the database.
 */

export async function getCurrentBrand(): Promise<Brand | null> {
  return null;
}

export async function listPosts(): Promise<PostWithVersion[]> {
  return [];
}

export async function getPost(id: string): Promise<PostWithVersion | null> {
  const posts = await listPosts();
  return posts.find((post) => post.id === id) ?? null;
}

export async function getBrandGuidelines(): Promise<BrandGuidelines | null> {
  return null;
}

export async function listBrandAssets(): Promise<BrandAsset[]> {
  return [];
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
