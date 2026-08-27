import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

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

export const metadata: Metadata = {
  title: 'Apex Social AI',
  description: 'AI-native social media operating system.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-bg text-text-primary">{children}</body>
    </html>
  );
}
