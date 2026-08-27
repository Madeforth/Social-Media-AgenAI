import { POST_STATUSES, type PostStatus, type PostWithVersion } from '@apex/types';

import { LibraryIcon, SparkIcon } from '@/components/icons';
import { LocaleLink } from '@/components/locale-link';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreativePreview } from '@/components/ui/creative-preview';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatusChip } from '@/components/ui/status-chip';
import type { Dictionary } from '@/i18n/dictionary';
import { getI18n } from '@/i18n/get-dictionary';
import { cn } from '@/lib/cn';
import { listPosts } from '@/lib/data';

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale } = await params;
  const { dictionary } = await getI18n(locale);
  return { title: `${dictionary.meta.library} · Apex Social AI` };
}

function isPostStatus(value: string | undefined): value is PostStatus {
  return value !== undefined && (POST_STATUSES as readonly string[]).includes(value);
}

function PostCard({ post, dictionary }: { post: PostWithVersion; dictionary: Dictionary }) {
  return (
    <LocaleLink href={`/posts/${post.id}`}>
      <Card interactive className="flex h-full flex-col overflow-hidden">
        <CreativePreview
          post={post}
          labels={dictionary}
          ratio="feed"
          className="rounded-none border-0 border-b"
        />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium leading-snug text-text-primary">
              {post.version.headline || post.concept_title}
            </p>
            <StatusChip status={post.status} label={dictionary.status[post.status]} />
          </div>
          <p className="text-xs text-text-muted">
            {post.content_pillar}
            {post.visual_format ? ` · ${dictionary.visualFormat[post.visual_format]}` : ''}
          </p>
        </div>
      </Card>
    </LocaleLink>
  );
}

export default async function LibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ status }, allPosts, { locale }] = await Promise.all([searchParams, listPosts(), params]);
  const { dictionary } = await getI18n(locale);
  const activeStatus = isPostStatus(status) ? status : null;
  const posts = activeStatus ? allPosts.filter((post) => post.status === activeStatus) : allPosts;

  // Only offer filters that would actually return something.
  const availableStatuses = POST_STATUSES.filter((candidate) =>
    allPosts.some((post) => post.status === candidate),
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader title={dictionary.library.title} description={dictionary.library.description} />

      {allPosts.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <LocaleLink
            href="/library"
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs transition-colors duration-150',
              activeStatus === null
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary',
            )}
          >
            {dictionary.library.all(allPosts.length)}
          </LocaleLink>
          {availableStatuses.map((candidate) => {
            const count = allPosts.filter((post) => post.status === candidate).length;
            const active = activeStatus === candidate;
            return (
              <LocaleLink
                key={candidate}
                href={`/library?status=${candidate}`}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors duration-150',
                  active
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary',
                )}
              >
                {dictionary.status[candidate]} ({count})
              </LocaleLink>
            );
          })}
        </div>
      ) : null}

      {posts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} dictionary={dictionary} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<LibraryIcon className="h-5 w-5" />}
            title={
              activeStatus
                ? dictionary.library.emptyFilteredTitle
                : dictionary.library.emptyNoStatusTitle
            }
            description={
              activeStatus
                ? dictionary.library.emptyFilteredDescription
                : dictionary.library.emptyNoStatusDescription
            }
            action={
              activeStatus ? undefined : (
                <ButtonLink href="/create" variant="primary">
                  <SparkIcon className="h-4 w-4" />
                  {dictionary.library.createWithAi}
                </ButtonLink>
              )
            }
          />
        </Card>
      )}
    </div>
  );
}
