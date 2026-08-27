import type { Locale } from '@/i18n/config';

/**
 * All formatting is pinned to UTC. The app renders on the server and hydrates on
 * the client, and a timezone difference between the two would produce a
 * hydration mismatch on every date on the page.
 */
const TIME_ZONE = 'UTC';

const intlLocale: Record<Locale, string> = { tr: 'tr-TR', en: 'en-GB' };

function formatter(locale: Locale, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(intlLocale[locale], { ...options, timeZone: TIME_ZONE });
}

export const formatWeekday = (iso: string, locale: Locale) =>
  formatter(locale, { weekday: 'short' })
    .format(new Date(iso))
    .toLocaleUpperCase(intlLocale[locale]);
export const formatDayOfMonth = (iso: string, locale: Locale) =>
  formatter(locale, { day: '2-digit' }).format(new Date(iso));
export const formatDate = (iso: string, locale: Locale) =>
  formatter(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
export const formatTime = (iso: string, locale: Locale) =>
  formatter(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
export const formatMonthYear = (iso: string, locale: Locale) =>
  formatter(locale, { month: 'long', year: 'numeric' }).format(new Date(iso));

/** First one or two letters of the user's email, upper-cased, for an avatar badge. */
export function initialsFromEmail(email: string | null | undefined): string {
  if (!email) return '?';
  const name = email.split('@')[0] ?? '';
  const parts = name.split(/[._-]/).filter(Boolean);
  const letters = parts.length >= 2 ? `${parts[0]![0]}${parts[1]![0]}` : name.slice(0, 2) || '?';
  return letters.toUpperCase();
}
