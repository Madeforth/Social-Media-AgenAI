import { PlugIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { createOrganizationAndBrand, signOutAction } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentBrand } from '@/lib/data';
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

export default async function SettingsPage({ params }: PageParams) {
  const { locale } = await params;
  const [brand, user, { dictionary }] = await Promise.all([
    getCurrentBrand(),
    getCurrentUser(),
    getI18n(locale),
  ]);
  const copy = dictionary.settings;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={copy.title} description={copy.description} />

      <Card>
        <CardHeader title={copy.account.title} />
        <CardDivider />
        <div className="divide-y divide-border-subtle">
          <Row
            title={user?.email ?? copy.account.signedInAs}
            description={copy.account.signedInAs}
            action={
              <form action={signOutAction}>
                <input type="hidden" name="locale" value={locale} />
                <Button type="submit">{copy.account.signOut}</Button>
              </form>
            }
          />
        </div>
      </Card>

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
          ) : (
            <form
              action={createOrganizationAndBrand}
              className="flex flex-wrap items-end justify-between gap-4 px-5 py-4"
            >
              <input type="hidden" name="locale" value={locale} />
              <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-sm text-text-primary">{copy.brand.createFirstBrand}</span>
                <span className="text-xs text-text-secondary">{copy.brand.multiBrandNotice}</span>
                <input
                  type="text"
                  name="brandName"
                  required
                  placeholder={copy.brand.brandNamePlaceholder}
                  aria-label={copy.brand.brandNameLabel}
                  className="mt-1.5 w-full max-w-xs rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-text-primary outline-none transition-colors duration-150 placeholder:text-text-muted focus:border-accent"
                />
              </label>
              <Button type="submit" variant="primary">
                {copy.brand.newBrand}
              </Button>
            </form>
          )}
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
