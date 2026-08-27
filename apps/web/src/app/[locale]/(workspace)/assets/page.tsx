import { AssetsIcon, UploadIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardDivider, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FieldLabel, Input } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { DeleteAssetButton } from '@/components/delete-asset-button';
import { BRAND_ASSET_TYPES } from '@apex/types';
import { getI18n } from '@/i18n/get-dictionary';
import { uploadBrandAsset } from '@/lib/actions';
import { getCurrentBrand, listBrandAssets } from '@/lib/data';

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale } = await params;
  const { dictionary } = await getI18n(locale);
  return { title: `${dictionary.meta.assets} · Apex Social AI` };
}

export default async function AssetsPage({ params }: PageParams) {
  const { locale } = await params;
  const [brand, assets, { dictionary }] = await Promise.all([
    getCurrentBrand(),
    listBrandAssets(),
    getI18n(locale),
  ]);
  const copy = dictionary.assets;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title={copy.title} description={copy.description} />

      <p className="rounded-md border border-border-subtle bg-surface px-4 py-3 text-xs text-text-secondary">
        {copy.trustedNotice}
      </p>

      {brand ? (
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <UploadIcon className="h-4 w-4 text-accent" />
                {copy.uploadAsset}
              </span>
            }
          />
          <CardDivider />
          <form
            action={uploadBrandAsset}
            encType="multipart/form-data"
            className="grid gap-4 p-5 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
          >
            <input type="hidden" name="locale" value={locale} />
            <FieldLabel label={copy.uploadForm.name}>
              <Input name="name" required maxLength={120} />
            </FieldLabel>
            <FieldLabel label={copy.uploadForm.type}>
              <select
                name="assetType"
                required
                className="h-[38px] w-full rounded-md border border-border-subtle bg-surface-raised px-3 text-sm text-text-primary outline-none focus:border-accent"
              >
                {BRAND_ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {dictionary.assetType[type]}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label={copy.uploadForm.file}>
              <input
                type="file"
                name="file"
                required
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="block w-full text-xs text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-surface-raised file:px-3 file:py-2 file:text-xs file:text-text-primary"
              />
            </FieldLabel>
            <Button type="submit" variant="primary">
              {copy.uploadForm.submit}
            </Button>
          </form>
        </Card>
      ) : null}

      {assets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <div className="flex aspect-[4/3] items-center justify-center border-b border-border-subtle bg-surface-raised text-text-muted">
                <AssetsIcon className="h-7 w-7" />
              </div>
              <div className="flex items-center justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm text-text-primary">{asset.name}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {dictionary.assetType[asset.asset_type]}
                  </p>
                </div>
                <DeleteAssetButton
                  assetId={asset.id}
                  storagePath={asset.storage_path}
                  locale={locale}
                  confirmMessage={copy.removeConfirm}
                  label={copy.remove}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<AssetsIcon className="h-5 w-5" />}
            title={copy.emptyTitle}
            description={copy.emptyDescription}
          />
        </Card>
      )}
    </div>
  );
}
