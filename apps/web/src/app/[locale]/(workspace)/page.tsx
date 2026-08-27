import {
  AnalyticsIcon,
  CalendarIcon,
  ChevronRightIcon,
  ClockIcon,
  PencilIcon,
  SendIcon,
  SparkIcon,
} from '@/components/icons';
import { LocaleLink } from '@/components/locale-link';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { CreativePreview } from '@/components/ui/creative-preview';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/stat-card';
import { StatusChip } from '@/components/ui/status-chip';
import type { Dictionary } from '@/i18n/dictionary';
import { getI18n } from '@/i18n/get-dictionary';
import { getDashboardSummary, listApprovalQueue, listUpcomingPosts } from '@/lib/data';
import { formatDayOfMonth, formatTime, formatWeekday } from '@/lib/format';
import type { PostWithVersion } from '@apex/types';

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale } = await params;
  const { dictionary } = await getI18n(locale);
  return { title: `${dictionary.meta.dashboard} · Apex Social AI` };
}

function UpcomingRow({
  post,
  locale,
  dictionary,
}: {
  post: PostWithVersion;
  locale: 'tr' | 'en';
  dictionary: Dictionary;
}) {
  return (
    <LocaleLink
      href={`/posts/${post.id}`}
      className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-surface-raised"
    >
      <span className="w-9 shrink-0 text-center">
        <span className="block text-[10px] font-medium tracking-wide text-text-muted">
          {post.scheduled_at ? formatWeekday(post.scheduled_at, locale) : '—'}
        </span>
        <span className="block text-lg font-semibold leading-tight text-text-primary">
          {post.scheduled_at ? formatDayOfMonth(post.scheduled_at, locale) : '--'}
        </span>
      </span>
      <CreativePreview
        post={post}
        labels={dictionary}
        ratio="square"
        size="sm"
        className="w-14 shrink-0"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-text-primary">
          {post.version.headline || post.concept_title}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
          <ClockIcon className="h-3.5 w-3.5" />
          {post.scheduled_at
            ? formatTime(post.scheduled_at, locale)
            : dictionary.dashboard.upcoming.notScheduled}
        </span>
      </span>
      <StatusChip status={post.status} label={dictionary.status[post.status]} />
    </LocaleLink>
  );
}

function ApprovalCard({ post, dictionary }: { post: PostWithVersion; dictionary: Dictionary }) {
  return (
    <div className="flex gap-4 rounded-md border border-border-subtle bg-surface-raised p-3">
      <CreativePreview
        post={post}
        labels={dictionary}
        ratio="feed"
        size="sm"
        className="w-24 shrink-0"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-sm font-medium text-text-primary">{post.version.headline}</p>
        <p className="mt-0.5 text-xs text-text-muted">{post.content_pillar}</p>
        <div className="mt-auto flex gap-2 pt-3">
          <ButtonLink href={`/posts/${post.id}`} variant="primary" size="sm" className="flex-1">
            {dictionary.dashboard.approval.review}
          </ButtonLink>
          <ButtonLink href={`/posts/${post.id}`} size="sm" className="flex-1">
            <PencilIcon className="h-3.5 w-3.5" />
            {dictionary.dashboard.approval.edit}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage({ params }: PageParams) {
  const { locale: requestedLocale } = await params;
  const [summary, upcoming, approvals, i18n] = await Promise.all([
    getDashboardSummary(),
    listUpcomingPosts(),
    listApprovalQueue(),
    getI18n(requestedLocale),
  ]);
  const { locale, dictionary } = i18n;
  const copy = dictionary.dashboard;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{copy.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{copy.subtitle}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={copy.stats.plannedThisWeek}
          value={summary.plannedThisWeek}
          unit={summary.plannedThisWeek === 1 ? copy.postUnitSingular : copy.postUnitPlural}
          icon={<CalendarIcon className="h-4.5 w-4.5" />}
          tint="#a78bfa"
        />
        <StatCard
          label={copy.stats.readyToApprove}
          value={summary.readyToApprove}
          unit={summary.readyToApprove === 1 ? copy.postUnitSingular : copy.postUnitPlural}
          icon={<ClockIcon className="h-4.5 w-4.5" />}
          tint="#f97316"
        />
        <StatCard
          label={copy.stats.scheduled}
          value={summary.scheduled}
          unit={summary.scheduled === 1 ? copy.postUnitSingular : copy.postUnitPlural}
          icon={<SendIcon className="h-4.5 w-4.5" />}
          tint="#22d3ee"
        />
        <StatCard
          label={copy.stats.published}
          value={summary.publishedThisMonth}
          unit={copy.stats.thisMonth}
          icon={<AnalyticsIcon className="h-4.5 w-4.5" />}
          tint="#34d399"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <Card className="relative overflow-hidden p-6 lg:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(34,211,238,0.16), transparent 65%)',
            }}
          />
          <div className="relative max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent">
              <SparkIcon className="h-3.5 w-3.5" />
              {copy.createCard.badge}
            </span>
            <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-text-primary lg:text-3xl">
              {copy.createCard.heading}
            </h2>
            <p className="mt-3 text-sm text-text-secondary">{copy.createCard.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/create" variant="primary">
                <SparkIcon className="h-4 w-4" />
                {copy.createCard.createButton}
              </ButtonLink>
              <ButtonLink href="/create?mode=custom_brief">
                {copy.createCard.customBrief}
              </ButtonLink>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader
            title={copy.upcoming.title}
            action={
              <LocaleLink
                href="/calendar"
                className="inline-flex items-center gap-1 text-xs text-text-secondary transition-colors duration-150 hover:text-accent"
              >
                {copy.upcoming.viewCalendar}
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </LocaleLink>
            }
          />
          <CardDivider />
          {upcoming.length > 0 ? (
            <div className="divide-y divide-border-subtle">
              {upcoming.map((post) => (
                <UpcomingRow key={post.id} post={post} locale={locale} dictionary={dictionary} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CalendarIcon className="h-5 w-5" />}
              title={copy.upcoming.emptyTitle}
              description={copy.upcoming.emptyDescription}
            />
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <Card className="flex flex-col">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                {copy.approval.title}
                {approvals.length > 0 ? (
                  <span className="rounded-full bg-secondary-soft px-2 py-0.5 text-[11px] font-medium text-secondary">
                    {approvals.length}
                  </span>
                ) : null}
              </span>
            }
            action={
              <LocaleLink
                href="/library?status=READY"
                className="inline-flex items-center gap-1 text-xs text-text-secondary transition-colors duration-150 hover:text-accent"
              >
                {copy.approval.viewAll}
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </LocaleLink>
            }
          />
          <CardDivider />
          {approvals.length > 0 ? (
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {approvals.map((post) => (
                <ApprovalCard key={post.id} post={post} dictionary={dictionary} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={copy.approval.emptyTitle}
              description={copy.approval.emptyDescription}
            />
          )}
        </Card>

        <Card className="flex flex-col">
          <CardHeader title={copy.performance.title} />
          <CardDivider />
          {/*
            Impressions, reach and engagement can only come from Instagram, so
            this panel stays empty until an account is connected.
          */}
          <EmptyState
            icon={<AnalyticsIcon className="h-5 w-5" />}
            title={copy.performance.emptyTitle}
            description={copy.performance.emptyDescription}
            action={<ButtonLink href="/settings">{copy.performance.connectInstagram}</ButtonLink>}
          />
        </Card>
      </div>
    </div>
  );
}
