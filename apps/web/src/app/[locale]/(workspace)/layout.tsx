import type { ReactNode } from 'react';

import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { getDictionary } from '@/i18n/get-dictionary';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentBrand } from '@/lib/data';

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { locale } = await params;
  const [brand, user, dictionary] = await Promise.all([
    getCurrentBrand(),
    getCurrentUser(),
    getDictionary(locale),
  ]);
  const shellLabels = {
    nav: dictionary.nav,
    sidebar: dictionary.sidebar,
    topbar: dictionary.topbar,
    localeSwitcher: dictionary.localeSwitcher,
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar brandName={brand?.name ?? null} labels={shellLabels} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar brandName={brand?.name ?? null} userEmail={user?.email ?? null} labels={shellLabels} />
        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
