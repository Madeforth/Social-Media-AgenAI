import { BRAND_ASSET_TYPE_LABELS } from '@apex/ui';

import { AssetsIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { listBrandAssets } from '@/lib/data';

export const metadata = { title: 'Assets · Apex Social AI' };

export default async function AssetsPage() {
  const assets = await listBrandAssets();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Asset Library"
        description="Logos, product screenshots, badges and reference imagery the AI may use."
        action={<Button variant="primary">Upload asset</Button>}
      />

      <p className="rounded-md border border-border-subtle bg-surface px-4 py-3 text-xs text-text-secondary">
        Product UI screenshots are treated as trusted assets. The AI may place one inside a
        composition, but it never redraws or invents product interface.
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
                  {BRAND_ASSET_TYPE_LABELS[asset.asset_type]}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<AssetsIcon className="h-5 w-5" />}
            title="No assets yet"
            description="Upload a logo, product screenshots and reference imagery. Files are stored in a private Supabase bucket; only the path is kept in the database."
            action={<Button variant="primary">Upload asset</Button>}
          />
        </Card>
      )}
    </div>
  );
}
