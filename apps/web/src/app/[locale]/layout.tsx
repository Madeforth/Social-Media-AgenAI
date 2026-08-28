import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

import '../globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

/**
 * Rendered per request, never prerendered.
 *
 * Two reasons, and either alone is sufficient. The CSP nonce is issued by the
 * middleware for each request, and Next can only stamp it onto its scripts
 * while rendering — a page baked at build time would carry a stale nonce and
 * the browser would refuse every script on it. And every screen shows the
 * signed-in user's own brand data, so there is no HTML here that is correct to
 * cache for someone else.
 */
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: 'Madeforth Social AI',
    description: dict.meta.rootDescription,
  };
}

export default async function RootLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  await getDictionary(locale);

  return (
    <html lang={locale} className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-bg text-text-primary">{children}</body>
    </html>
  );
}
