import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { en, tr } from './dictionaries';
import { hasLocale, type Locale, type MobileDictionary } from './dictionary';

const STORAGE_KEY = 'apex-social-ai.locale';
const dictionaries: Record<Locale, MobileDictionary> = { tr, en };

function deviceLocale(): Locale {
  return getLocales()[0]?.languageCode === 'en' ? 'en' : 'tr';
}

interface I18nValue {
  locale: Locale;
  dictionary: MobileDictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((storedLocale) => {
        if (active && hasLocale(storedLocale)) setLocaleState(storedLocale);
      })
      .catch(() => {
        // The device locale remains a safe fallback when storage is unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    void AsyncStorage.setItem(STORAGE_KEY, nextLocale).catch(() => {
      // The in-memory selection still works for the current session.
    });
  }, []);

  const value = useMemo(
    () => ({ locale, dictionary: dictionaries[locale], setLocale }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
