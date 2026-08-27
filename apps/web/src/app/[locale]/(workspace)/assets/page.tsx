import { AssetsIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { getI18n } from '@/i18n/get-dictionary';
import { listBrandAssets } from '@/lib/data';

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
  const [assets, { dictionary }] = await Promise.all([listBrandAssets(), getI18n(locale)]);
  const copy = dictionary.assets;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title={copy.title}
        description={copy.description}
        action={<Button variant="primary">{copy.uploadAsset}</Button>}
      />

      <p className="rounded-md border border-border-subtle bg-surface px-4 py-3 text-xs text-text-secondary">
        {copy.trustedNotice}
      </p>

      {assets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset) => (
            <Card key={asset.id} interactive className="overflow-hidden">
              <div className="flex aspect-[4/3] items-center justify-center border-b border-border-subtle bg-surface-raised text-text-muted">
                <AssetsIcon className="h-7 w-7" />
              </div>
              <div className="p-4">
                <p className="truncate text-sm text-text-primary">{asset.name}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {dictionary.assetType[asset.asset_type]}
                </p>
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
            action={<Button variant="primary">{copy.uploadAsset}</Button>}
          />
        </Card>
      )}
    </div>
  );
}
