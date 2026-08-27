import { MOCK_NOW, MOCK_POSTS, type MockPost } from '@apex/mocks';
import { POST_STATUS_PRESENTATION } from '@apex/ui';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/cn';
import { formatMonthYear } from '@/lib/format';

export const metadata = { title: 'Calendar · Apex Social AI' };

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** The date a post occupies on the calendar: when it published, else when it is due. */
function calendarDate(post: MockPost): string | null {
  return post.published_at ?? post.scheduled_at;
}

function toDayKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Days of the month that contains `MOCK_NOW`, padded to whole Monday-start weeks.
 * Everything is computed in UTC so the grid matches the UTC-pinned formatters.
 */
function buildMonthGrid(reference: string): Array<{ key: string; inMonth: boolean }> {
  const ref = new Date(reference);
  const year = ref.getUTCFullYear();
  const month = ref.getUTCMonth();

  const first = new Date(Date.UTC(year, month, 1));
  const leading = (first.getUTCDay() + 6) % 7;
  const start = new Date(first.getTime() - leading * 86400000);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start.getTime() + index * 86400000);
    return {
      key: day.toISOString().slice(0, 10),
      inMonth: day.getUTCMonth() === month,
    };
  });
}

export default function CalendarPage() {
  const grid = buildMonthGrid(MOCK_NOW);
  const todayKey = toDayKey(MOCK_NOW);

  const byDay = new Map<string, MockPost[]>();
  for (const post of MOCK_POSTS) {
    const at = calendarDate(post);
    if (!at) continue;
    const key = toDayKey(at);
    byDay.set(key, [...(byDay.get(key) ?? []), post]);
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        title="Calendar"
        description={`${formatMonthYear(MOCK_NOW)} · scheduled and published content`}
      />

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border-subtle">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map(({ key, inMonth }) => {
            const posts = byDay.get(key) ?? [];
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                className={cn(
                  'min-h-28 border-b border-r border-border-subtle p-2 last:border-r-0',
                  !inMonth && 'bg-bg/40',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                    isToday
                      ? 'bg-accent font-semibold text-[#04252b]'
                      : inMonth
                        ? 'text-text-secondary'
                        : 'text-text-muted/60',
                  )}
                >
                  {Number(key.slice(8, 10))}
                </span>
                <div className="mt-1.5 flex flex-col gap-1">
                  {posts.map((post) => {
                    const { tint, surface } = POST_STATUS_PRESENTATION[post.status];
                    return (
                      <Link
                        key={post.id}
                        href={`/posts/${post.id}`}
                        className="truncate rounded px-1.5 py-1 text-[11px] leading-tight transition-opacity duration-150 hover:opacity-80"
                        style={{ color: tint, backgroundColor: surface }}
                      >
                        {post.version.headline || post.concept_title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 text-xs text-text-muted">
        {(['SCHEDULED', 'PUBLISHED', 'FAILED'] as const).map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: POST_STATUS_PRESENTATION[status].tint }}
            />
            {POST_STATUS_PRESENTATION[status].label}
          </span>
        ))}
      </div>
    </div>
  );
}
