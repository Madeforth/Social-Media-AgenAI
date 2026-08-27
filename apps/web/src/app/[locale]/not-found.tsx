import { locale as getRootLocale } from 'next/root-params';
import Link from 'next/link';

import { defaultLocale, hasLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

export default async function LocalizedNotFound() {
  const requestedLocale = await getRootLocale();
  const locale = hasLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const dictionary = await getDictionary(locale);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-accent">404</p>
      <h1 className="text-2xl font-semibold text-text-primary">{dictionary.notFound.title}</h1>
      <p className="max-w-sm text-sm text-text-secondary">{dictionary.notFound.description}</p>
      <Link
        href={`/${locale}`}
        className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-[#04252b] transition-colors duration-150 hover:bg-accent-strong"
      >
        {dictionary.notFound.backToDashboard}
      </Link>
    </main>
  );
}
