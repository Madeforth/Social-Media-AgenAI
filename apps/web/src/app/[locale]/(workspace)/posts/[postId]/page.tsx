import { VISUAL_FORMAT_LABELS } from '@apex/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  PencilIcon,
  RefreshIcon,
} from '@/components/icons';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { CreativePreview } from '@/components/ui/creative-preview';
import { StatusChip } from '@/components/ui/status-chip';
import { getPost } from '@/lib/data';
import { formatDate, formatTime } from '@/lib/format';

interface PageParams {
  params: Promise<{ postId: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { postId } = await params;
  const post = await getPost(postId);
  return { title: `${post?.concept_title ?? 'Post'} · Apex Social AI` };
}

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">{label}</p>
        {hint ? <p className="text-[11px] text-text-muted">{hint}</p> : null}
      </div>
      <p className="mt-1.5 whitespace-pre-line rounded-md border border-border-subtle bg-surface-raised px-3 py-2.5 text-sm text-text-primary">
        {value || <span className="text-text-muted">Not generated yet</span>}
      </p>
    </div>
  );
}

export default async function PostDetailPage({ params }: PageParams) {
  const { postId } = await params;
  const post = await getPost(postId);

  if (!post) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/library" className="transition-colors duration-150 hover:text-text-primary">
          Content Library
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5" />
        <span className="text-text-secondary">{post.concept_title}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-text-primary">
              {post.concept_title}
            </h1>
            <StatusChip status={post.status} />
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {post.content_pillar}
            {post.visual_format ? ` · ${VISUAL_FORMAT_LABELS[post.visual_format]}` : ''} · v
            {post.version.version_number}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="md">
            <RefreshIcon className="h-4 w-4" />
            Regenerate
          </Button>
          <Button size="md">
            <PencilIcon className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="primary" size="md">
            <CheckIcon className="h-4 w-4" />
            Approve
          </Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
        <div className="flex flex-col gap-4">
          <CreativePreview post={post} ratio="feed" size="lg" />
          {post.ui_asset_required ? (
            <p className="rounded-md border border-border-subtle bg-surface px-3 py-2.5 text-xs text-text-secondary">
              This concept uses a real product screenshot. The asset is placed as supplied and is
              never redrawn.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Strategy" />
            <CardDivider />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Objective" value={post.objective} />
              <Field label="Content pillar" value={post.content_pillar} />
              <div className="sm:col-span-2">
                <Field label="Creative direction" value={post.version.creative_direction} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Copy" />
            <CardDivider />
            <div className="flex flex-col gap-4 p-5">
              <Field
                label="Headline"
                value={post.version.headline}
                hint={`${post.version.headline.length}/60`}
              />
              <Field label="Supporting copy" value={post.version.supporting_copy} />
              <Field
                label="Caption"
                value={post.version.caption}
                hint={`${post.version.caption.length}/2200`}
              />
              <Field label="Call to action" value={post.version.cta} />
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">Hashtags</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {post.version.hashtags.length > 0 ? (
                    post.version.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border-subtle bg-surface-raised px-2.5 py-1 text-xs text-text-secondary"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-text-muted">Not generated yet</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Schedule" />
            <CardDivider />
            <div className="flex flex-col gap-3 p-5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-secondary">Publish at</span>
                <span className="flex items-center gap-1.5 text-text-primary">
                  <ClockIcon className="h-4 w-4 text-text-muted" />
                  {post.scheduled_at
                    ? `${formatDate(post.scheduled_at)}, ${formatTime(post.scheduled_at)}`
                    : 'Not scheduled'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-secondary">Platform</span>
                <span className="text-text-primary">Instagram</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-secondary">Account</span>
                <ButtonLink href="/settings" size="sm">
                  Connect
                </ButtonLink>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
