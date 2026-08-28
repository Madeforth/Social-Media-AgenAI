import { PlugIcon } from '@/components/icons';
import { LocaleLink } from '@/components/locale-link';
import { Button } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { FieldLabel, Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SubmitButton } from '@/components/ui/submit-button';
import {
  addAiProvider,
  connectInstagram,
  disconnectInstagram,
  syncInstagramProfile,
  deleteAiProvider,
  createOrganizationAndBrand,
  signOutAction,
  setAiQuotaUnlimited,
  setAiRouting,
  setConnectionModels,
  updateBrand,
} from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import {
  getAiProviderStateWithModels,
  getAiQuotaStatus,
  getCurrentBrand,
  getSocialAccount,
} from '@/lib/data';
import { getI18n } from '@/i18n/get-dictionary';
import { formatDate } from '@/lib/format';

interface PageParams {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    igConnected?: string;
    igError?: string;
    igSynced?: string;
    providerSaved?: string;
    providerError?: string;
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
  const { igConnected, igError, igSynced, providerSaved, providerError } = await searchParams;
  const [brand, user, socialAccount, aiState, quota, { dictionary, locale: activeLocale }] =
    await Promise.all([
      getCurrentBrand(),
      getCurrentUser(),
      getSocialAccount(),
      getAiProviderStateWithModels(),
      getAiQuotaStatus(),
      getI18n(locale),
    ]);
  const copy = dictionary.settings;
  const igCopy = copy.integrations.instagram;
  const aiCopy = copy.integrations.ai;
  const quotaCopy = copy.integrations.quota;

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
          {igSynced ? (
            <p className="mx-5 mt-4 rounded-md border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-accent">
              {igCopy.syncedBanner}
            </p>
          ) : null}
          {igError ? (
            <div className="mx-5 mt-4 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2">
              <p className="text-xs text-red-300">{igCopy.errorBanner}</p>
              {igError !== 'failed' && igError !== 'network' ? (
                <p className="mt-1 break-words text-xs text-red-200/80">{igError}</p>
              ) : null}
            </div>
          ) : null}
          {socialAccount ? (
            <div className="flex flex-col gap-3 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-text-primary">{igCopy.title}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {igCopy.connected(socialAccount.account_name)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={syncInstagramProfile}>
                    <input type="hidden" name="locale" value={locale} />
                    <SubmitButton
                      label={igCopy.syncProfile}
                      pendingLabel={dictionary.pending.syncButton}
                      variant="secondary"
                      size="sm"
                    />
                  </form>
                  {/*
                    Without this there is no way to replace a token. The connect
                    form only appears when no account exists, so an expired
                    connection was permanent.
                  */}
                  <form action={disconnectInstagram}>
                    <input type="hidden" name="locale" value={locale} />
                    <SubmitButton
                      label={igCopy.disconnect}
                      pendingLabel={dictionary.pending.saveButton}
                      variant="ghost"
                      size="sm"
                    />
                  </form>
                </div>
              </div>

              <p className="text-xs text-text-muted">{igCopy.syncProfileHint}</p>

              {socialAccount.status !== 'CONNECTED' ? (
                <p className="rounded-md border border-orange-900/50 bg-orange-950/30 px-3 py-2 text-xs text-orange-200">
                  {igCopy.tokenExpired}
                </p>
              ) : null}

              {socialAccount.profile_synced_at ? (
                <p className="text-xs text-text-secondary">
                  {igCopy.lastSynced(formatDate(socialAccount.profile_synced_at, activeLocale))}
                  {socialAccount.biography ? ` · ${igCopy.bioStored}` : ''}
                  {typeof socialAccount.followers_count === 'number'
                    ? ` · ${socialAccount.followers_count} ${igCopy.followers}`
                    : ''}
                </p>
              ) : (
                <p className="text-xs text-text-muted">{igCopy.neverSynced}</p>
              )}
            </div>
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
                    <SubmitButton
                      label={igCopy.formSubmit}
                      pendingLabel={dictionary.pending.verifyButton}
                    />
                  </div>
                </form>
              ) : null}
            </div>
          )}
          {providerSaved ? (
            <p className="mx-5 mt-4 rounded-md border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-accent">
              {aiCopy.savedBanner}
            </p>
          ) : null}
          {providerError ? (
            <div className="mx-5 mt-4 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2">
              <p className="text-xs text-red-300">{aiCopy.errorBanner}</p>
              {/*
                The provider's own sentence, not a paraphrase. "Add a payment
                method and credits to use this API key" is the entire answer;
                a generic failure message sends someone hunting for a bug that
                is not in this codebase.
              */}
              {providerError !== 'failed' && providerError !== 'network' ? (
                <p className="mt-1 break-words text-xs text-red-200/80">{providerError}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-5 px-5 py-4">
            <div>
              <p className="text-sm text-text-primary">{aiCopy.title}</p>
              <p className="mt-0.5 text-xs text-text-secondary">{aiCopy.description}</p>
            </div>

            {aiState && aiState.connections.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {aiState.connections.map((connection) => (
                  <li
                    key={connection.id}
                    className="flex flex-col gap-3 rounded-md border border-border-subtle bg-surface-raised px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary">{connection.label}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {connection.provider}
                        {connection.provider === 'IDEOGRAM'
                          ? ` · ${connection.image_model ?? 'BALANCED'}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <form action={setConnectionModels} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="connectionId" value={connection.id} />
                        {connection.provider === 'IDEOGRAM' ? (
                          <FieldLabel label={aiCopy.renderingSpeed}>
                            <Select
                              name="imageModel"
                              defaultValue={connection.image_model ?? 'BALANCED'}
                            >
                              {aiState.ideogram_rendering_speeds.map((speed) => (
                                <option key={speed} value={speed}>
                                  {speed}
                                </option>
                              ))}
                            </Select>
                          </FieldLabel>
                        ) : (
                          <>
                            <FieldLabel label={aiCopy.textModel}>
                              <Select name="textModel" defaultValue={connection.text_model ?? ''}>
                                <option value="">
                                  {`${aiCopy.useDefault} (${aiState.defaults.text_model})`}
                                </option>
                                {connection.available.text.map((model) => (
                                  <option key={model} value={model}>
                                    {model}
                                  </option>
                                ))}
                              </Select>
                            </FieldLabel>
                            <FieldLabel label={aiCopy.imageModel}>
                              <Select name="imageModel" defaultValue={connection.image_model ?? ''}>
                                <option value="">
                                  {`${aiCopy.useDefault} (${aiState.defaults.image_model})`}
                                </option>
                                {connection.available.image.map((model) => (
                                  <option key={model} value={model}>
                                    {model}
                                  </option>
                                ))}
                              </Select>
                            </FieldLabel>
                          </>
                        )}
                        <SubmitButton
                          label={aiCopy.save}
                          pendingLabel={dictionary.pending.saveButton}
                          variant="secondary"
                          size="sm"
                        />
                      </form>
                      <form action={deleteAiProvider}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="connectionId" value={connection.id} />
                        <SubmitButton
                          label={aiCopy.remove}
                          pendingLabel={dictionary.pending.saveButton}
                          variant="ghost"
                          size="sm"
                        />
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-muted">{aiCopy.noneYet}</p>
            )}

            {aiState && aiState.connections.length < aiState.limit ? (
              <form action={addAiProvider} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="locale" value={locale} />
                <FieldLabel label={aiCopy.provider}>
                  <Select name="provider" defaultValue="GEMINI">
                    {aiState.providers.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </Select>
                </FieldLabel>
                <FieldLabel label={aiCopy.label} hint={aiCopy.labelHint}>
                  <Input name="label" required maxLength={40} />
                </FieldLabel>
                <div className="min-w-0 flex-1">
                  <FieldLabel label={aiCopy.apiKey} hint={aiCopy.apiKeyHint}>
                    <Input name="apiKey" type="password" required />
                  </FieldLabel>
                </div>
                <SubmitButton label={aiCopy.add} pendingLabel={dictionary.pending.verifyButton} />
              </form>
            ) : aiState ? (
              <p className="text-xs text-text-muted">{aiCopy.limitReached}</p>
            ) : null}

            {aiState && aiState.connections.length > 0 ? (
              <form
                action={setAiRouting}
                className="flex flex-col gap-3 border-t border-border-subtle pt-4"
              >
                <input type="hidden" name="locale" value={locale} />
                <p className="text-xs text-text-secondary">{aiCopy.routingDescription}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldLabel label={aiCopy.textJob} hint={aiCopy.textJobHint}>
                    <Select
                      name="textProvider"
                      defaultValue={aiState.routing.text_provider_key_id ?? ''}
                    >
                      <option value="">{aiCopy.automatic}</option>
                      {aiState.connections
                        .filter((connection) => connection.provider === 'GEMINI')
                        .map((connection) => (
                          <option key={connection.id} value={connection.id}>
                            {connection.label}
                          </option>
                        ))}
                    </Select>
                  </FieldLabel>
                  <FieldLabel label={aiCopy.imageJob}>
                    <Select
                      name="imageProvider"
                      defaultValue={aiState.routing.image_provider_key_id ?? ''}
                    >
                      <option value="">{aiCopy.automatic}</option>
                      {aiState.connections.map((connection) => (
                        <option key={connection.id} value={connection.id}>
                          {connection.label} · {connection.provider}
                        </option>
                      ))}
                    </Select>
                  </FieldLabel>
                </div>
                <div>
                  <SubmitButton
                    label={aiCopy.saveRouting}
                    pendingLabel={dictionary.pending.saveButton}
                    variant="secondary"
                  />
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </Card>

      {quota ? (
        <Card>
          <CardHeader title={quotaCopy.title} />
          <CardDivider />
          <div className="flex flex-col gap-4 p-5">
            <p className="text-xs text-text-secondary">{quotaCopy.description}</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
                  {quotaCopy.hourlyLabel}
                </p>
                <p className="mt-1 text-sm text-text-primary">{quota.hourlyLimit}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
                  {quotaCopy.dailyLabel}
                </p>
                <p className="mt-1 text-sm text-text-primary">{quota.dailyLimit}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
                  {quotaCopy.monthlyLabel}
                </p>
                <p className="mt-1 text-sm text-text-primary">{quota.monthlyLimit}</p>
              </div>
            </div>
            <Row
              title={quotaCopy.unlimitedLabel}
              description={quotaCopy.unlimitedDescription}
              action={
                <form action={setAiQuotaUnlimited}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="unlimited" value={(!quota.unlimited).toString()} />
                  <SubmitButton
                    label={quota.unlimited ? quotaCopy.turnOn : quotaCopy.turnOff}
                    pendingLabel={dictionary.pending.saveButton}
                    variant={quota.unlimited ? 'primary' : 'secondary'}
                  />
                </form>
              }
            />
          </div>
        </Card>
      ) : null}

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
