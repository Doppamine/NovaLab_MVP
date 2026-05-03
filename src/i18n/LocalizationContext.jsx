import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from './translations';

export const SUPPORTED_LOCALES = ['en', 'ru'];

export const LocalizationContext = createContext({
  locale: 'en',
  setLocale: () => {},
  t: (value) => value,
  localizeTree: (value) => value,
});

function resolveInitialLocale() {
  const savedLocale = localStorage.getItem('novalab-locale');
  if (SUPPORTED_LOCALES.includes(savedLocale)) return savedLocale;
  return 'en';
}

function translateValue(value, locale) {
  if (typeof value !== 'string') return value;
  return translations[locale]?.[value] ?? value;
}

function localizeTreeValue(value, locale) {
  if (Array.isArray(value)) {
    return value.map((entry) => localizeTreeValue(entry, locale));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, localizeTreeValue(entry, locale)]),
    );
  }

  return translateValue(value, locale);
}

export function LocalizationProvider({ children }) {
  const [locale, setLocale] = useState(resolveInitialLocale);

  useEffect(() => {
    localStorage.setItem('novalab-locale', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (input) => translateValue(input, locale),
    localizeTree: (input) => localizeTreeValue(input, locale),
  }), [locale]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocalizationContext);
}
