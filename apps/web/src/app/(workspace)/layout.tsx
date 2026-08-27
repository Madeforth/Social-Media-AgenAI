import type { ReactNode } from 'react';

import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { getCurrentBrand } from '@/lib/data';

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const brand = await getCurrentBrand();

  return (
    <div className="flex min-h-screen">
      <Sidebar brandName={brand?.name ?? null} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar brandName={brand?.name ?? null} />
        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
