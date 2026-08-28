import { PlugIcon } from '@/components/icons';
import { LocaleLink } from '@/components/locale-link';
import { Button } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { FieldLabel, Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import {
  connectGemini,
  connectInstagram,
  createOrganizationAndBrand,
  selectGeminiModels,
  signOutAction,
  updateBrand,
} from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import {
  getCurrentBrand,
  getGeminiKeyConnected,
  getGeminiModelOptions,
  getSocialAccount,
} from '@/lib/data';
import { getI18n } from '@/i18n/get-dictionary';

interface PageParams {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    igConnected?: string;
    igError?: string;
    geminiConnected?: string;
    geminiError?: string;
    modelsSaved?: string;
    modelsError?: string;
  }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale } = await params;
  const { dictionary } = await getI18n(locale);
  return { title: `${dictionary.meta.settings} · Madeforth Social AI` };
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
  const { igConnected, igError, geminiConnected, geminiError, modelsSaved, modelsError } =
    await searchParams;
  const [brand, user, socialAccount, geminiKeyConnected, modelOptions, { dictionary }] =
    await Promise.all([
      getCurrentBrand(),
      getCurrentUser(),
      getSocialAccount(),
      getGeminiKeyConnected(),
      getGeminiModelOptions(),
      getI18n(locale),
    ]);
  const copy = dictionary.settings;
  const igCopy = copy.integrations.instagram;
  const geminiCopy = copy.integrations.gemini;
  const modelCopy = geminiCopy.models;

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
          {geminiConnected ? (
            <p className="mx-5 mt-4 rounded-md border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-accent">
              {geminiCopy.connectedBanner}
            </p>
          ) : null}
          {geminiError ? (
            <p className="mx-5 mt-4 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
              {geminiCopy.errorBanner}
            </p>
          ) : null}
          {geminiKeyConnected ? (
            <>
              <Row
                title={geminiCopy.title}
                description={geminiCopy.connected}
                action={<span className="text-xs text-text-muted">{geminiCopy.serverSide}</span>}
              />
              <div className="px-5 py-4">
                <p className="text-sm text-text-primary">{modelCopy.title}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{modelCopy.description}</p>

                {modelsSaved ? (
                  <p className="mt-3 rounded-md border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-accent">
                    {modelCopy.savedBanner}
                  </p>
                ) : null}
                {modelsError ? (
                  <p className="mt-3 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                    {modelCopy.errorBanner}
                  </p>
                ) : null}

                {modelOptions ? (
                  <form action={selectGeminiModels} className="mt-4 flex flex-col gap-4">
                    <input type="hidden" name="locale" value={locale} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldLabel label={modelCopy.textLabel}>
                        <Select
                          name="textModel"
                          defaultValue={modelOptions.selected.text_model ?? ''}
                        >
                          <option value="">
                            {`${modelCopy.useDefault} (${modelOptions.defaults.text_model})`}
                          </option>
                          {modelOptions.text.map((model) => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          ))}
                        </Select>
                      </FieldLabel>
                      <FieldLabel label={modelCopy.imageLabel}>
                        <Select
                          name="imageModel"
                          defaultValue={modelOptions.selected.image_model ?? ''}
                        >
                          <option value="">
                            {`${modelCopy.useDefault} (${modelOptions.defaults.image_model})`}
                          </option>
                          {modelOptions.image.map((model) => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          ))}
                        </Select>
                      </FieldLabel>
                    </div>
                    <p className="text-xs text-text-muted">{modelCopy.imageBillingNote}</p>
                    <div>
                      <Button type="submit">{modelCopy.submit}</Button>
                    </div>
                  </form>
                ) : (
                  <p className="mt-3 text-xs text-text-muted">{modelCopy.listError}</p>
                )}
              </div>
            </>
          ) : (
            <div className="px-5 py-4">
              <p className="text-sm text-text-primary">{geminiCopy.title}</p>
              <p className="mt-0.5 text-xs text-text-secondary">{geminiCopy.description}</p>
              {brand ? (
                <form action={connectGemini} className="mt-4 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="locale" value={locale} />
                  <div className="min-w-0 flex-1">
                    <FieldLabel label={geminiCopy.formApiKey} hint={geminiCopy.formApiKeyHint}>
                      <Input name="apiKey" type="password" required />
                    </FieldLabel>
                  </div>
                  <Button type="submit" variant="primary">
                    {geminiCopy.formSubmit}
                  </Button>
                </form>
              ) : null}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title={copy.brand.title} />
        <CardDivider />
        <div className="divide-y divide-border-subtle">
          {brand ? (
            <form action={updateBrand} className="flex flex-col gap-4 px-5 py-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="brandId" value={brand.id} />
              <div className="flex flex-wrap items-end gap-3">
                <FieldLabel label={copy.brand.editNameLabel}>
                  <Input name="name" defaultValue={brand.name} required />
                </FieldLabel>
                <div className="min-w-0 flex-1">
                  <FieldLabel label={copy.brand.editDescriptionLabel}>
                    <Input
                      name="description"
                      defaultValue={brand.description ?? ''}
                      placeholder={copy.brand.editDescriptionPlaceholder}
                    />
                  </FieldLabel>
                </div>
              </div>
              <FieldLabel label={copy.brand.appUrlLabel} hint={copy.brand.appUrlHint}>
                <Input
                  name="appUrl"
                  type="url"
                  inputMode="url"
                  defaultValue={brand.app_url ?? ''}
                  placeholder={copy.brand.appUrlPlaceholder}
                />
              </FieldLabel>
              <div>
                <Button type="submit" variant="primary">
                  {copy.brand.save}
                </Button>
              </div>
            </form>
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
        <CardHeader
          title={copy.notifications.title}
          action={
            <LocaleLink href="/notifications" className="text-xs text-accent hover:underline">
              {copy.notifications.viewAll}
            </LocaleLink>
          }
        />
        <CardDivider />
        <div className="divide-y divide-border-subtle">
          <Row
            title={copy.notifications.approvalRequired.title}
            description={copy.notifications.approvalRequired.description}
            action={<span className="text-xs text-accent">{copy.notifications.alwaysOn}</span>}
          />
          <Row
            title={copy.notifications.publishFailures.title}
            description={copy.notifications.publishFailures.description}
            action={<span className="text-xs text-accent">{copy.notifications.alwaysOn}</span>}
          />
        </div>
      </Card>
    </div>
  );
}
