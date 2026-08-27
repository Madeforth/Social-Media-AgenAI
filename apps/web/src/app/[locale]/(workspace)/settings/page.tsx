import { PlugIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { FieldLabel, Input } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { connectInstagram, createOrganizationAndBrand, signOutAction } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentBrand, getSocialAccount } from '@/lib/data';
import { getI18n } from '@/i18n/get-dictionary';

interface PageParams {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ igConnected?: string; igError?: string }>;
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

export default async function SettingsPage({ params, searchParams }: PageParams) {
  const { locale } = await params;
  const { igConnected, igError } = await searchParams;
  const [brand, user, socialAccount, { dictionary }] = await Promise.all([
    getCurrentBrand(),
    getCurrentUser(),
    getSocialAccount(),
    getI18n(locale),
  ]);
  const copy = dictionary.settings;
  const igCopy = copy.integrations.instagram;

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
          {igConnected ? (
            <p className="mx-5 mt-4 rounded-md border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-accent">
              {igCopy.connectedBanner}
            </p>
          ) : null}
          {igError ? (
            <p className="mx-5 mt-4 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
              {igCopy.errorBanner}
            </p>
          ) : null}
          {socialAccount?.status === 'CONNECTED' ? (
            <Row
              title={igCopy.title}
              description={igCopy.connected(socialAccount.account_name)}
              action={<span className="text-xs text-text-muted">{copy.account.signedInAs}</span>}
            />
          ) : (
            <div className="px-5 py-4">
              <p className="text-sm text-text-primary">{igCopy.title}</p>
              <p className="mt-0.5 text-xs text-text-secondary">{igCopy.description}</p>
              {brand ? (
                <form action={connectInstagram} className="mt-4 grid gap-3 sm:grid-cols-3">
                  <input type="hidden" name="locale" value={locale} />
                  <FieldLabel label={igCopy.formAccountName}>
                    <Input name="accountName" required />
                  </FieldLabel>
                  <FieldLabel label={igCopy.formExternalId} hint={igCopy.formExternalIdHint}>
                    <Input name="externalAccountId" required />
                  </FieldLabel>
                  <FieldLabel label={igCopy.formAccessToken} hint={igCopy.formAccessTokenHint}>
                    <Input name="accessToken" type="password" required />
                  </FieldLabel>
                  <div className="sm:col-span-3">
                    <Button type="submit" variant="primary">
                      {igCopy.formSubmit}
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
          )}
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
