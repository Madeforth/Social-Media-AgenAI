import type { Brand, BrandAsset, BrandGuidelines, PostStatus, PostWithVersion } from '@apex/types';
import { useEffect, useState } from 'react';

import { useAuth } from '@/auth/provider';

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

export function usePosts(): Query<PostWithVersion[]> {
  const brand = useCurrentBrand();
  const [state, setState] = useState<Query<PostWithVersion[]>>({
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
  }, [brand.loading, brand.data]);

  return state;
}

export function usePost(id: string): Query<PostWithVersion | null> {
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
