import { AnalyticsIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { getI18n } from '@/i18n/get-dictionary';

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale } = await params;
  const { dictionary } = await getI18n(locale);
  return { title: `${dictionary.meta.analytics} · Apex Social AI` };
}

export default async function AnalyticsPage({ params }: PageParams) {
  const { locale } = await params;
  const { dictionary } = await getI18n(locale);
  const copy = dictionary.analytics;
  const metrics = Object.values(copy.metrics);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title={copy.title} description={copy.description} />

      {/*
        These figures come from the Meta Graph API and nowhere else. The tiles
        render as unavailable rather than showing a placeholder number that would
        be indistinguishable from a real one.
      */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric} className="p-5">
            <p className="text-xs font-medium text-text-secondary">{metric}</p>
            <p className="mt-3 text-2xl font-semibold text-text-muted">—</p>
            <p className="mt-1 text-xs text-text-muted">{copy.noAccountConnected}</p>
          </Card>
        ))}
      </div>

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
    </div>
  );
}
