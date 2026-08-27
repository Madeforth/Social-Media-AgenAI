import 'server-only';

import { notFound } from 'next/navigation';

import { hasLocale, type Locale } from './config';
import type { Dictionary } from './dictionary';

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  tr: () => import('./dictionaries/tr').then((module) => module.tr),
  en: () => import('./dictionaries/en').then((module) => module.en),
};

export async function getDictionary(locale: string): Promise<Dictionary> {
  if (!hasLocale(locale)) notFound();
  return dictionaries[locale]();
}

export async function getI18n(locale: string): Promise<{ locale: Locale; dictionary: Dictionary }> {
  if (!hasLocale(locale)) notFound();
  return { locale, dictionary: await dictionaries[locale]() };
}
