'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ComponentProps } from 'react';

import { hasLocale } from '@/i18n/config';

type LocaleLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

/**
 * `next/link` prefixed with the current `[locale]` route segment. Every
 * internal link in the app should use this instead of `next/link` directly,
 * so navigation never drops the active locale.
 */
export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const params = useParams();
  const locale = typeof params.locale === 'string' && hasLocale(params.locale) ? params.locale : '';
  const prefixed = href.startsWith('/') ? `/${locale}${href}` : href;
  return <Link href={prefixed} {...props} />;
}
