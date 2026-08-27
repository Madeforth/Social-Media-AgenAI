import { BellIcon } from '@/components/icons';
import { LocaleLink } from '@/components/locale-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { getI18n } from '@/i18n/get-dictionary';
import { markAllNotificationsRead, markNotificationRead } from '@/lib/actions';
import { listNotifications } from '@/lib/data';
import { formatDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/cn';

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale } = await params;
  const { dictionary } = await getI18n(locale);
  return { title: `${dictionary.notificationsPage.title} · Apex Social AI` };
}

export default async function NotificationsPage({ params }: PageParams) {
  const { locale: requestedLocale } = await params;
  const [notifications, { locale, dictionary }] = await Promise.all([
    listNotifications(),
    getI18n(requestedLocale),
  ]);
  const copy = dictionary.notificationsPage;
  const hasUnread = notifications.some((notification) => !notification.read_at);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title={copy.title}
        description={copy.description}
        action={
          hasUnread ? (
            <form action={markAllNotificationsRead}>
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit">{copy.markAllRead}</Button>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BellIcon className="h-5 w-5" />}
            title={copy.emptyTitle}
            description={copy.emptyDescription}
          />
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border-subtle">
            {notifications.map((notification) => {
              const postId =
                notification.payload && typeof notification.payload.post_id === 'string'
                  ? notification.payload.post_id
                  : null;
              const body = (
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
                    {copy.type[notification.type]}
                  </p>
                  <p
                    className={cn(
                      'mt-1 text-sm',
                      notification.read_at ? 'text-text-secondary' : 'text-text-primary',
                    )}
                  >
                    {notification.title}
                  </p>
                  {notification.body ? (
                    <p className="mt-0.5 text-xs text-text-secondary">{notification.body}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-text-muted">
                    {formatDate(notification.created_at, locale)},{' '}
                    {formatTime(notification.created_at, locale)}
                  </p>
                </div>
              );

              return (
                <div key={notification.id} className="flex items-start gap-3 px-5 py-4">
                  {!notification.read_at ? (
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    />
                  ) : (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />
                  )}
                  {postId ? (
                    <LocaleLink href={`/posts/${postId}`} className="min-w-0 flex-1">
                      {body}
                    </LocaleLink>
                  ) : (
                    <div className="min-w-0 flex-1">{body}</div>
                  )}
                  {!notification.read_at ? (
                    <form action={markNotificationRead} className="shrink-0">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="notificationId" value={notification.id} />
                      <Button type="submit" size="sm">
                        {copy.markRead}
                      </Button>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
