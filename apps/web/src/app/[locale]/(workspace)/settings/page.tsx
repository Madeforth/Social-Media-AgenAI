import { PlugIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getI18n } from '@/i18n/get-dictionary';

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale } = await params;
  const { dictionary } = await getI18n(locale);
  return { title: `${dictionary.meta.settings} · Apex Social AI` };
}

function Row({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm text-text-primary">{title}</p>
        <p className="mt-0.5 text-xs text-text-secondary">{description}</p>
      </div>
      {action}
    </div>
  );
}

import { getCurrentBrand } from '@/lib/data';

export default async function SettingsPage({ params }: PageParams) {
  const { locale } = await params;
  const [brand, { dictionary }] = await Promise.all([getCurrentBrand(), getI18n(locale)]);
  const copy = dictionary.settings;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={copy.title} description={copy.description} />

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <PlugIcon className="h-4 w-4 text-accent" />
              {copy.integrations.title}
            </span>
          }
        />
        <CardDivider />
        <div className="divide-y divide-border-subtle">
          <Row
            title={copy.integrations.instagram.title}
            description={copy.integrations.instagram.description}
            action={<Button variant="primary">{copy.integrations.instagram.connect}</Button>}
          />
          <Row
            title={copy.integrations.gemini.title}
            description={copy.integrations.gemini.description}
            action={
              <span className="text-xs text-text-muted">{copy.integrations.gemini.serverSide}</span>
            }
          />
        </div>
      </Card>

      <Card>
        <CardHeader title={copy.brand.title} />
        <CardDivider />
        <div className="divide-y divide-border-subtle">
          {brand ? (
            <Row
              title={brand.name}
              description={brand.description ?? copy.brand.noDescriptionYet}
              action={<Button>{copy.brand.manage}</Button>}
            />
          ) : null}
          <Row
            title={brand ? copy.brand.addBrand : copy.brand.createFirstBrand}
            description={copy.brand.multiBrandNotice}
            action={
              <Button variant={brand ? 'secondary' : 'primary'}>{copy.brand.newBrand}</Button>
            }
          />
        </div>
      </Card>

      <Card>
        <CardHeader title={copy.notifications.title} />
        <CardDivider />
        <div className="divide-y divide-border-subtle">
          <Row
            title={copy.notifications.approvalRequired.title}
            description={copy.notifications.approvalRequired.description}
            action={
              <span className="text-xs text-text-muted">{copy.notifications.notConfigured}</span>
            }
          />
          <Row
            title={copy.notifications.publishFailures.title}
            description={copy.notifications.publishFailures.description}
            action={
              <span className="text-xs text-text-muted">{copy.notifications.notConfigured}</span>
            }
          />
        </div>
      </Card>
    </div>
  );
}
