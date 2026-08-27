import { AnalyticsIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

export const metadata = { title: 'Analytics · Apex Social AI' };

const METRICS = ['Impressions', 'Reach', 'Engagement', 'Profile visits'];

export default function AnalyticsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Analytics"
        description="Performance for published content, pulled from Instagram."
      />

      {/*
        These figures come from the Meta Graph API and nowhere else. The tiles
        render as unavailable rather than showing a placeholder number that would
        be indistinguishable from a real one.
      */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((metric) => (
          <Card key={metric} className="p-5">
            <p className="text-xs font-medium text-text-secondary">{metric}</p>
            <p className="mt-3 text-2xl font-semibold text-text-muted">—</p>
            <p className="mt-1 text-xs text-text-muted">No account connected</p>
          </Card>
        ))}
      </div>

      <Card>
        <EmptyState
          icon={<AnalyticsIcon className="h-5 w-5" />}
          title="Connect Instagram to see performance"
          description="Once an account is connected, published posts start reporting impressions, reach, engagement and profile visits here."
          action={
            <ButtonLink href="/settings" variant="primary">
              Go to integrations
            </ButtonLink>
          }
        />
      </Card>
    </div>
  );
}
