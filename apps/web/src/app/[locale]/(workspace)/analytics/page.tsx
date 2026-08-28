import { AnalyticsIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { getI18n } from '@/i18n/get-dictionary';
import { getAnalyticsSummary } from '@/lib/data';

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale } = await params;
  const { dictionary } = await getI18n(locale);
  return { title: `${dictionary.meta.analytics} · Madeforth Social AI` };
}

export default async function AnalyticsPage({ params }: PageParams) {
  const { locale } = await params;
  const [summary, { dictionary }] = await Promise.all([getAnalyticsSummary(), getI18n(locale)]);
  const copy = dictionary.analytics;

  const tiles: Array<{ label: string; value: number | null }> = [
    { label: copy.metrics.impressions, value: summary.hasMetrics ? summary.impressions : null },
    { label: copy.metrics.reach, value: summary.hasMetrics ? summary.reach : null },
    { label: copy.metrics.engagement, value: summary.hasMetrics ? summary.engagement : null },
    { label: copy.metrics.profileVisits, value: summary.profileVisits },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title={copy.title} description={copy.description} />

      {/*
        These figures come from the Meta Graph API and nowhere else. A tile
        renders as unavailable rather than showing a placeholder number that
        would be indistinguishable from a real one.
      */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-5">
            <p className="text-xs font-medium text-text-secondary">{tile.label}</p>
            <p
              className={
                tile.value === null
                  ? 'mt-3 text-2xl font-semibold text-text-muted'
                  : 'mt-3 text-2xl font-semibold text-text-primary'
              }
            >
              {tile.value === null ? '—' : tile.value.toLocaleString(locale)}
            </p>
            {tile.value === null ? (
              <p className="mt-1 text-xs text-text-muted">
                {summary.connected ? copy.notYetSynced : copy.noAccountConnected}
              </p>
            ) : null}
          </Card>
        ))}
      </div>

      {!summary.connected ? (
        <Card>
          <EmptyState
            icon={<AnalyticsIcon className="h-5 w-5" />}
            title={copy.connectTitle}
            description={copy.connectDescription}
            action={
              <ButtonLink href="/settings" variant="primary">
                {copy.goToIntegrations}
              </ButtonLink>
            }
          />
        </Card>
      ) : !summary.hasMetrics ? (
        <Card>
          <EmptyState
            icon={<AnalyticsIcon className="h-5 w-5" />}
            title={copy.noSyncTitle}
            description={copy.noSyncDescription}
          />
        </Card>
      ) : null}
    </div>
  );
}
