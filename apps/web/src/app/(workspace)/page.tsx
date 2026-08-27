import {
  MOCK_NOW,
  mockApprovalQueue,
  mockDashboardSummary,
  mockUpcomingPosts,
  type MockPost,
} from '@apex/mocks';
import Link from 'next/link';

import {
  AnalyticsIcon,
  CalendarIcon,
  ChevronRightIcon,
  ClockIcon,
  PencilIcon,
  SendIcon,
  SparkIcon,
} from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { CreativePreview } from '@/components/ui/creative-preview';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/stat-card';
import { StatusChip } from '@/components/ui/status-chip';
import { formatDayOfMonth, formatRelative, formatTime, formatWeekday } from '@/lib/format';

export const metadata = { title: 'Dashboard · Apex Social AI' };

function UpcomingRow({ post }: { post: MockPost }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-surface-raised"
    >
      <span className="w-9 shrink-0 text-center">
        <span className="block text-[10px] font-medium tracking-wide text-text-muted">
          {post.scheduled_at ? formatWeekday(post.scheduled_at) : '—'}
        </span>
        <span className="block text-lg font-semibold leading-tight text-text-primary">
          {post.scheduled_at ? formatDayOfMonth(post.scheduled_at) : '--'}
        </span>
      </span>
      <CreativePreview post={post} ratio="square" size="sm" className="w-14 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-text-primary">
          {post.version.headline || post.concept_title}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
          <ClockIcon className="h-3.5 w-3.5" />
          {post.scheduled_at ? formatTime(post.scheduled_at) : 'Not scheduled'}
        </span>
      </span>
      <StatusChip status={post.status} />
    </Link>
  );
}

function ApprovalCard({ post }: { post: MockPost }) {
  return (
    <div className="flex gap-4 rounded-md border border-border-subtle bg-surface-raised p-3">
      <CreativePreview post={post} ratio="feed" size="sm" className="w-24 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-sm font-medium text-text-primary">{post.version.headline}</p>
        <p className="mt-0.5 text-xs text-text-muted">{post.content_pillar}</p>
        <p className="mt-1 text-xs text-text-muted">
          Created {formatRelative(post.created_at, MOCK_NOW)} · v{post.version.version_number}
        </p>
        <div className="mt-auto flex gap-2 pt-3">
          <ButtonLink href={`/posts/${post.id}`} variant="primary" size="sm" className="flex-1">
            Review
          </ButtonLink>
          <ButtonLink href={`/posts/${post.id}`} size="sm" className="flex-1">
            <PencilIcon className="h-3.5 w-3.5" />
            Edit
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const summary = mockDashboardSummary();
  const upcoming = mockUpcomingPosts();
  const approvals = mockApprovalQueue();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Good morning, Muhammed
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Here&rsquo;s what&rsquo;s happening with your content.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Planned this week"
          value={summary.plannedThisWeek}
          unit={summary.plannedThisWeek === 1 ? 'post' : 'posts'}
          icon={<CalendarIcon className="h-4.5 w-4.5" />}
          tint="#a78bfa"
        />
        <StatCard
          label="Ready to approve"
          value={summary.readyToApprove}
          unit={summary.readyToApprove === 1 ? 'post' : 'posts'}
          icon={<ClockIcon className="h-4.5 w-4.5" />}
          tint="#f97316"
        />
        <StatCard
          label="Scheduled"
          value={summary.scheduled}
          unit={summary.scheduled === 1 ? 'post' : 'posts'}
          icon={<SendIcon className="h-4.5 w-4.5" />}
          tint="#22d3ee"
        />
        <StatCard
          label="Published"
          value={summary.publishedThisMonth}
          unit="this month"
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
              Create with AI
            </span>
            <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-text-primary lg:text-3xl">
              Let AI create engaging content for your audience
            </h2>
            <p className="mt-3 text-sm text-text-secondary">
              Tell the AI what you need, or let it decide what the brand should say next.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/create" variant="primary">
                <SparkIcon className="h-4 w-4" />
                Create with AI
              </ButtonLink>
              <ButtonLink href="/create?mode=custom_brief">Custom brief</ButtonLink>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader
            title="Upcoming posts"
            action={
              <Link
                href="/calendar"
                className="inline-flex items-center gap-1 text-xs text-text-secondary transition-colors duration-150 hover:text-accent"
              >
                View calendar
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardDivider />
          {upcoming.length > 0 ? (
            <div className="divide-y divide-border-subtle">
              {upcoming.map((post) => (
                <UpcomingRow key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CalendarIcon className="h-5 w-5" />}
              title="Nothing scheduled"
              description="Approved posts appear here once they have a publish time."
            />
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <Card className="flex flex-col">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                Ready for approval
                {approvals.length > 0 ? (
                  <span className="rounded-full bg-secondary-soft px-2 py-0.5 text-[11px] font-medium text-secondary">
                    {approvals.length}
                  </span>
                ) : null}
              </span>
            }
            action={
              <Link
                href="/library?status=READY"
                className="inline-flex items-center gap-1 text-xs text-text-secondary transition-colors duration-150 hover:text-accent"
              >
                View all
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardDivider />
          {approvals.length > 0 ? (
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {approvals.map((post) => (
                <ApprovalCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Approval queue is clear"
              description="Generated posts land here for review before they can be scheduled."
            />
          )}
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Performance overview" />
          <CardDivider />
          {/*
            Impressions, reach and engagement can only come from Instagram.
            Rendering invented figures here would be indistinguishable from real
            data once the account is connected, so the panel stays empty.
          */}
          <EmptyState
            icon={<AnalyticsIcon className="h-5 w-5" />}
            title="No performance data yet"
            description="Connect an Instagram account to pull impressions, reach and profile visits into this panel."
            action={<ButtonLink href="/settings">Connect Instagram</ButtonLink>}
          />
        </Card>
      </div>
    </div>
  );
}
