import type { Locale } from '@/i18n/dictionary';

/**
 * Formatting is pinned to UTC so the mobile app and the web app label the same
 * row with the same date, whatever the device timezone is.
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
export const formatDayMonth = (iso: string, locale: Locale) =>
  formatter(locale, { day: 'numeric', month: 'short' }).format(new Date(iso));
export const formatTime = (iso: string, locale: Locale) =>
  formatter(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
