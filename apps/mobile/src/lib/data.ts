import type { Brand, BrandAsset, BrandGuidelines, PostStatus, PostWithVersion } from '@apex/types';

/**
 * The single seam between the screens and their data source.
 *
 * Supabase is not provisioned yet, so every hook resolves to an empty result and
 * the screens render their empty states. When the project exists, only the
 * bodies here change — the screens already handle loading, error and empty, so
 * none of them has to be rewritten, and none has ever shown data that did not
 * come from the database.
 */
export interface Query<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

function resolved<T>(data: T): Query<T> {
  return { data, loading: false, error: null };
}

export function useCurrentBrand(): Query<Brand | null> {
  return resolved(null);
}

export function usePosts(): Query<PostWithVersion[]> {
  return resolved([]);
}

export function usePost(id: string): Query<PostWithVersion | null> {
  const posts = usePosts();
  return {
    ...posts,
    data: posts.data.find((post) => post.id === id) ?? null,
  };
}

export function useBrandGuidelines(): Query<BrandGuidelines | null> {
  return resolved(null);
}

export function useBrandAssets(): Query<BrandAsset[]> {
  return resolved([]);
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
