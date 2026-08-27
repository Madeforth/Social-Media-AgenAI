import { POST_STATUSES, type PostStatus, type PostWithVersion } from '@apex/types';
import { POST_STATUS_PRESENTATION, VISUAL_FORMAT_LABELS } from '@apex/ui';
import Link from 'next/link';

import { LibraryIcon, SparkIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreativePreview } from '@/components/ui/creative-preview';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatusChip } from '@/components/ui/status-chip';
import { cn } from '@/lib/cn';
import { listPosts } from '@/lib/data';

export const metadata = { title: 'Content Library · Apex Social AI' };

function isPostStatus(value: string | undefined): value is PostStatus {
  return value !== undefined && (POST_STATUSES as readonly string[]).includes(value);
}

function PostCard({ post }: { post: PostWithVersion }) {
  return (
    <Link href={`/posts/${post.id}`}>
      <Card interactive className="flex h-full flex-col overflow-hidden">
        <CreativePreview post={post} ratio="feed" className="rounded-none border-0 border-b" />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium leading-snug text-text-primary">
              {post.version.headline || post.concept_title}
            </p>
            <StatusChip status={post.status} />
          </div>
          <p className="text-xs text-text-muted">
            {post.content_pillar}
            {post.visual_format ? ` · ${VISUAL_FORMAT_LABELS[post.visual_format]}` : ''}
          </p>
        </div>
      </Card>
    </Link>
  );
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ status }, allPosts] = await Promise.all([searchParams, listPosts()]);
  const activeStatus = isPostStatus(status) ? status : null;
  const posts = activeStatus ? allPosts.filter((post) => post.status === activeStatus) : allPosts;

  // Only offer filters that would actually return something.
  const availableStatuses = POST_STATUSES.filter((candidate) =>
    allPosts.some((post) => post.status === candidate),
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader title="Content Library" description="Every post for this brand, newest first." />

      {allPosts.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/library"
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs transition-colors duration-150',
              activeStatus === null
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary',
            )}
          >
            All ({allPosts.length})
          </Link>
          {availableStatuses.map((candidate) => {
            const count = allPosts.filter((post) => post.status === candidate).length;
            const active = activeStatus === candidate;
            return (
              <Link
                key={candidate}
                href={`/library?status=${candidate}`}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors duration-150',
                  active
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary',
                )}
              >
                {POST_STATUS_PRESENTATION[candidate].label} ({count})
              </Link>
            );
          })}
        </div>
      ) : null}

      {posts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<LibraryIcon className="h-5 w-5" />}
            title={activeStatus ? 'No posts with this status' : 'No posts yet'}
            description={
              activeStatus
                ? 'Try a different filter, or generate something new.'
                : 'Generated and drafted posts appear here once the workspace is connected to Supabase.'
            }
            action={
              activeStatus ? undefined : (
                <ButtonLink href="/create" variant="primary">
                  <SparkIcon className="h-4 w-4" />
                  Create with AI
                </ButtonLink>
              )
            }
          />
        </Card>
      )}
    </div>
  );
}
