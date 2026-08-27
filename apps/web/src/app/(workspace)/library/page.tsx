import { MOCK_NOW, MOCK_POSTS, type MockPost } from '@apex/mocks';
import { POST_STATUSES, type PostStatus } from '@apex/types';
import { POST_STATUS_PRESENTATION, VISUAL_FORMAT_LABELS } from '@apex/ui';
import Link from 'next/link';

import { LibraryIcon } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { CreativePreview } from '@/components/ui/creative-preview';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatusChip } from '@/components/ui/status-chip';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';

export const metadata = { title: 'Content Library · Apex Social AI' };

function isPostStatus(value: string | undefined): value is PostStatus {
  return value !== undefined && (POST_STATUSES as readonly string[]).includes(value);
}

function PostCard({ post }: { post: MockPost }) {
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
          <p className="mt-auto pt-2 text-xs text-text-muted">
            {formatRelative(post.created_at, MOCK_NOW)} · v{post.version.version_number}
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
  const { status } = await searchParams;
  const activeStatus = isPostStatus(status) ? status : null;
  const posts = activeStatus
    ? MOCK_POSTS.filter((post) => post.status === activeStatus)
    : MOCK_POSTS;

  // Only offer filters that would actually return something.
  const availableStatuses = POST_STATUSES.filter((candidate) =>
    MOCK_POSTS.some((post) => post.status === candidate),
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader title="Content Library" description="Every post for this brand, newest first." />

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
          All ({MOCK_POSTS.length})
        </Link>
        {availableStatuses.map((candidate) => {
          const count = MOCK_POSTS.filter((post) => post.status === candidate).length;
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
            title="No posts with this status"
            description="Try a different filter, or generate something new from Create with AI."
          />
        </Card>
      )}
    </div>
  );
}
