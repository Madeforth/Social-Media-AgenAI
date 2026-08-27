import type { PostStatus } from '@apex/types';

import { MOCK_POSTS, type MockPost } from './posts';
import { MOCK_NOW } from './time';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isWithinNextWeek(iso: string | null): boolean {
  if (!iso) return false;
  const at = new Date(iso).getTime();
  const now = new Date(MOCK_NOW).getTime();
  return at >= now && at <= now + WEEK_MS;
}

function isWithinLastMonth(iso: string | null): boolean {
  if (!iso) return false;
  const at = new Date(iso).getTime();
  const now = new Date(MOCK_NOW).getTime();
  return at <= now && at >= now - 30 * 24 * 60 * 60 * 1000;
}

/**
 * Dashboard counters. Every number here is counted from the fixtures, so the
 * dashboard never shows a figure that does not correspond to a visible post.
 */
export interface DashboardSummary {
  plannedThisWeek: number;
  readyToApprove: number;
  scheduled: number;
  publishedThisMonth: number;
}

export function mockDashboardSummary(posts: MockPost[] = MOCK_POSTS): DashboardSummary {
  return {
    plannedThisWeek: posts.filter(
      (post) => isWithinNextWeek(post.scheduled_at) || post.status === 'READY',
    ).length,
    readyToApprove: posts.filter((post) => post.status === 'READY').length,
    scheduled: posts.filter((post) => post.status === 'SCHEDULED').length,
    publishedThisMonth: posts.filter(
      (post) => post.status === 'PUBLISHED' && isWithinLastMonth(post.published_at),
    ).length,
  };
}

export function mockPostsByStatus(status: PostStatus, posts: MockPost[] = MOCK_POSTS): MockPost[] {
  return posts.filter((post) => post.status === status);
}

/** Scheduled posts in chronological order — what the dashboard lists as upcoming. */
export function mockUpcomingPosts(posts: MockPost[] = MOCK_POSTS): MockPost[] {
  return posts
    .filter((post) => post.scheduled_at !== null && post.status === 'SCHEDULED')
    .sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? ''));
}

export function mockApprovalQueue(posts: MockPost[] = MOCK_POSTS): MockPost[] {
  return posts
    .filter((post) => post.status === 'READY')
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
