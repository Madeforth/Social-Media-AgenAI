import 'server-only';

import type { Locale } from './config';
import type { Dictionary } from './dictionary';

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  tr: () => import('./dictionaries/tr').then((module) => module.tr),
  en: () => import('./dictionaries/en').then((module) => module.en),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
