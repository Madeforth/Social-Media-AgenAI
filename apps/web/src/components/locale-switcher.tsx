'use client';

import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';

import { hasLocale, locales, type Locale } from '@/i18n/config';
import { cn } from '@/lib/cn';

interface LocaleSwitcherProps {
  labels: {
    label: string;
    tr: string;
    en: string;
    switchToTurkish: string;
    switchToEnglish: string;
  };
}

export function LocaleSwitcher({ labels }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const activeLocale: Locale =
    typeof params.locale === 'string' && hasLocale(params.locale) ? params.locale : 'tr';

  const rest = pathname.replace(/^\/(tr|en)(?=\/|$)/, '') || '/';
  const search = searchParams.toString();

  return (
    <div
      aria-label={labels.label}
      className="flex items-center rounded-md border border-border-subtle bg-surface p-0.5"
      role="group"
    >
      {locales.map((locale) => {
        const active = locale === activeLocale;
        const languageLabel = locale === 'tr' ? labels.switchToTurkish : labels.switchToEnglish;
        return (
          <Link
            key={locale}
            href={`/${locale}${rest}${search ? `?${search}` : ''}`}
            hrefLang={locale}
            lang={locale}
            aria-label={languageLabel}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'rounded px-2 py-1 text-[11px] font-medium transition-colors duration-150',
              active ? 'bg-accent-soft text-accent' : 'text-text-muted hover:text-text-primary',
            )}
          >
            {labels[locale]}
          </Link>
        );
      })}
    </div>
  );
}
