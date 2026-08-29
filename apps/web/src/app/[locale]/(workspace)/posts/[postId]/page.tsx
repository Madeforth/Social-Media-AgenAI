import { notFound } from 'next/navigation';

import {
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  PencilIcon,
  RefreshIcon,
  SparkIcon,
} from '@/components/icons';
import { LocaleLink } from '@/components/locale-link';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { CreativePreview } from '@/components/ui/creative-preview';
import { StatusChip } from '@/components/ui/status-chip';
import { GenerationPoller } from '@/components/ui/generation-poller';
import { PendingBar } from '@/components/ui/pending-bar';
import { SubmitButton } from '@/components/ui/submit-button';
import { getI18n } from '@/i18n/get-dictionary';
import {
  approvePost,
  generateImage,
  publishPost,
  regeneratePost,
  requestRevision,
  schedulePost,
  syncMetrics,
} from '@/lib/actions';
import { getLatestCreativeRunStatus, getPost, getPostImageUrl } from '@/lib/data';
import { formatDate, formatTime } from '@/lib/format';

export const maxDuration = 60;

interface PageParams {
  params: Promise<{ locale: string; postId: string }>;
  searchParams: Promise<{
    imageError?: string;
    genError?: string;
    publishError?: string;
    detail?: string;
  }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, postId } = await params;
  const [post, i18n] = await Promise.all([getPost(postId), getI18n(locale)]);
  return {
    title: `${post?.concept_title ?? i18n.dictionary.meta.postFallback} · Madeforth Social AI`,
  };
}

function Field({
  label,
  value,
  emptyLabel,
  hint,
}: {
  label: string;
  value: string;
  emptyLabel: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">{label}</p>
        {hint ? <p className="text-[11px] text-text-muted">{hint}</p> : null}
      </div>
      <p className="mt-1.5 whitespace-pre-line rounded-md border border-border-subtle bg-surface-raised px-3 py-2.5 text-sm text-text-primary">
        {value || <span className="text-text-muted">{emptyLabel}</span>}
      </p>
    </div>
  );
}

export default async function PostDetailPage({ params, searchParams }: PageParams) {
  const { locale: requestedLocale, postId } = await params;
  const { imageError, genError, publishError, detail } = await searchParams;
  const [post, i18n] = await Promise.all([getPost(postId), getI18n(requestedLocale)]);

  if (!post) {
    notFound();
  }
  const { locale, dictionary } = i18n;
  const copy = dictionary.postDetail;
  const [imageUrl, creativeRun] = await Promise.all([
    getPostImageUrl(post.version.image_storage_path),
    getLatestCreativeRunStatus(post.version.id),
  ]);
  const imageErrorMessage =
    imageError && imageError in copy.imageErrors
      ? copy.imageErrors[imageError as keyof typeof copy.imageErrors]
      : null;
  const genErrorMessage =
    genError && genError in copy.genErrors
      ? copy.genErrors[genError as keyof typeof copy.genErrors]
      : null;
  const canApprove = post.status === 'READY' || post.status === 'REVISION';
  const canRequestRevision = post.status === 'READY';
  const canSchedule = post.status === 'APPROVED' || post.status === 'SCHEDULED';
  const canPublish = post.status === 'APPROVED' || post.status === 'SCHEDULED';

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted">
        <LocaleLink
          href="/library"
          className="transition-colors duration-150 hover:text-text-primary"
        >
          {copy.breadcrumbContentLibrary}
        </LocaleLink>
        <ChevronRightIcon className="h-3.5 w-3.5" />
        <span className="text-text-secondary">{post.concept_title}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-text-primary">
              {post.concept_title}
            </h1>
            <StatusChip status={post.status} label={dictionary.status[post.status]} />
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {post.content_pillar}
            {post.visual_format ? ` · ${dictionary.visualFormat[post.visual_format]}` : ''} · v
            {post.version.version_number}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/posts/${post.id}/edit`} size="md">
            <PencilIcon className="h-4 w-4" />
            {copy.edit}
          </ButtonLink>
          {canRequestRevision ? (
            <form action={requestRevision}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="postId" value={post.id} />
              <SubmitButton
                label={copy.requestRevision}
                pendingLabel={dictionary.pending.saveButton}
                variant="secondary"
              />
            </form>
          ) : null}
          {canApprove ? (
            <form action={approvePost}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="postId" value={post.id} />
              <SubmitButton
                label={copy.approve}
                pendingLabel={dictionary.pending.saveButton}
                icon={<CheckIcon className="h-4 w-4" />}
              />
            </form>
          ) : null}
          {canPublish ? (
            <form action={publishPost}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="postId" value={post.id} />
              <SubmitButton
                label={copy.publishNow}
                pendingLabel={dictionary.pending.publishButton}
              />
            </form>
          ) : null}
          {post.status === 'PUBLISHED' ? (
            <form action={syncMetrics}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="postId" value={post.id} />
              <SubmitButton
                label={copy.syncMetrics}
                pendingLabel={dictionary.pending.syncButton}
                variant="secondary"
                icon={<RefreshIcon className="h-4 w-4" />}
              />
            </form>
          ) : null}
        </div>
      </header>

      {creativeRun?.inProgress ? (
        <GenerationPoller message={copy.imageGenerating} elapsedSuffix={dictionary.pending.elapsedSuffix} />
      ) : null}

      {imageErrorMessage ? (
        <div className="rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3">
          <p className="text-sm text-red-300">{imageErrorMessage}</p>
          {detail ? (
            <p className="mt-2 break-words font-mono text-xs text-red-400/80">{detail}</p>
          ) : null}
        </div>
      ) : null}

      {genErrorMessage ? (
        <div className="rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3">
          <p className="text-sm text-red-300">{genErrorMessage}</p>
          {detail ? (
            <p className="mt-2 break-words font-mono text-xs text-red-400/80">{detail}</p>
          ) : null}
        </div>
      ) : null}

      {publishError ? (
        <p className="rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {copy.publishErrorBanner}
        </p>
      ) : null}

      <Card>
        <CardHeader title={copy.regenerate} />
        <CardDivider />
        <form action={regeneratePost} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="postId" value={post.id} />
          <label className="flex-1">
            <span className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
              {copy.revisionNoteLabel}
            </span>
            <textarea
              name="brief"
              rows={2}
              maxLength={2000}
              placeholder={copy.revisionNotePlaceholder}
              className="mt-1.5 w-full resize-none rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent"
            />
          </label>
          <SubmitButton
            label={copy.regenerate}
            pendingLabel={dictionary.pending.generateButton}
            variant="secondary"
            icon={<RefreshIcon className="h-4 w-4" />}
          />
        </form>
        <div className="px-5 pb-5">
          <PendingBar
            message={dictionary.pending.generating}
            elapsedSuffix={dictionary.pending.elapsedSuffix}
            slowNotice={dictionary.pending.slowNotice}
          />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
        <div className="flex flex-col gap-4">
          <CreativePreview
            post={post}
            labels={dictionary}
            ratio="feed"
            size="lg"
            imageUrl={imageUrl}
          />
          {post.ui_asset_required ? (
            <p className="rounded-md border border-border-subtle bg-surface px-3 py-2.5 text-xs text-text-secondary">
              {copy.uiAssetNotice}
            </p>
          ) : null}
          <form action={generateImage} className="flex flex-col gap-3">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="postId" value={post.id} />
            <SubmitButton
              label={imageUrl ? copy.regenerateImage : copy.generateImage}
              pendingLabel={dictionary.pending.imageButton}
              variant="secondary"
              className="w-full"
              icon={<SparkIcon className="h-4 w-4" />}
            />
            <PendingBar
              message={dictionary.pending.generatingImage}
              elapsedSuffix={dictionary.pending.elapsedSuffix}
              slowNotice={dictionary.pending.slowNotice}
            />
          </form>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title={copy.strategy.title} />
            <CardDivider />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field
                label={copy.strategy.objective}
                value={post.objective}
                emptyLabel={copy.notGeneratedYet}
              />
              <Field
                label={copy.strategy.contentPillar}
                value={post.content_pillar}
                emptyLabel={copy.notGeneratedYet}
              />
              <div className="sm:col-span-2">
                <Field
                  label={copy.strategy.creativeDirection}
                  value={post.version.creative_direction}
                  emptyLabel={copy.notGeneratedYet}
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={copy.copy.title} />
            <CardDivider />
            <div className="flex flex-col gap-4 p-5">
              <Field
                label={copy.copy.headline}
                value={post.version.headline}
                emptyLabel={copy.notGeneratedYet}
                hint={`${post.version.headline.length}/60`}
              />
              <Field
                label={copy.copy.supportingCopy}
                value={post.version.supporting_copy}
                emptyLabel={copy.notGeneratedYet}
              />
              <Field
                label={copy.copy.caption}
                value={post.version.caption}
                emptyLabel={copy.notGeneratedYet}
                hint={`${post.version.caption.length}/2200`}
              />
              <Field
                label={copy.copy.callToAction}
                value={post.version.cta}
                emptyLabel={copy.notGeneratedYet}
              />
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
                  {copy.copy.hashtags}
                </p>
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
                    <span className="text-sm text-text-muted">{copy.notGeneratedYet}</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={copy.schedule.title} />
            <CardDivider />
            <div className="flex flex-col gap-3 p-5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-secondary">{copy.schedule.publishAt}</span>
                <span className="flex items-center gap-1.5 text-text-primary">
                  <ClockIcon className="h-4 w-4 text-text-muted" />
                  {post.scheduled_at
                    ? `${formatDate(post.scheduled_at, locale)}, ${formatTime(post.scheduled_at, locale)}`
                    : copy.schedule.notScheduled}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-secondary">{copy.schedule.platform}</span>
                <span className="text-text-primary">{copy.schedule.instagram}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-secondary">{copy.schedule.account}</span>
                <ButtonLink href="/settings" size="sm">
                  {copy.schedule.connect}
                </ButtonLink>
              </div>
              {canSchedule ? (
                <form action={schedulePost} className="flex items-center gap-2 pt-1">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="postId" value={post.id} />
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    required
                    defaultValue={post.scheduled_at ? post.scheduled_at.slice(0, 16) : undefined}
                    className="h-9 flex-1 rounded-md border border-border-subtle bg-surface-raised px-2.5 text-xs text-text-primary outline-none focus:border-accent"
                  />
                  <Button type="submit" size="sm" variant="primary">
                    {post.status === 'SCHEDULED'
                      ? copy.schedule.rescheduleButton
                      : copy.schedule.scheduleButton}
                  </Button>
                </form>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
