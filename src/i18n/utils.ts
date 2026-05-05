import deTranslations from './de.json';
import enTranslations from './en.json';
import trTranslations from './tr.json';

export const languages = {
  de: 'Deutsch',
  en: 'English',
  tr: 'Türkçe',
} as const;

export const defaultLang: Lang = 'de';

export type Lang = keyof typeof languages;

type Dict = typeof deTranslations;

const translations: Record<Lang, Dict> = {
  de: deTranslations,
  en: enTranslations as Dict,
  tr: trTranslations as Dict,
};

export function getLangFromUrl(url: URL): Lang {
  const segment = url.pathname.split('/')[1];
  if (segment === 'en' || segment === 'tr') return segment;
  return defaultLang;
}

export function stripLangPrefix(pathname: string): string {
  const cleaned = pathname.replace(/^\/(en|tr)(?=\/|$)/, '');
  return cleaned === '' ? '/' : cleaned;
}

export function localizedPath(path: string, lang: Lang): string {
  if (lang === defaultLang) return path;
  if (path === '/') return `/${lang}/`;
  return `/${lang}${path}`;
}

function lookup(dict: unknown, keys: string[]): unknown {
  let value: unknown = dict;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return value;
}

function applyReplacements(value: string, replacements: Record<string, string | number>): string {
  let out = value;
  for (const [key, val] of Object.entries(replacements)) {
    out = out.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
  }
  return out;
}

export function useTranslations(lang: Lang) {
  const dict = translations[lang];
  return function t<T = string>(key: string, replacements?: Record<string, string | number>): T {
    const keys = key.split('.');
    let value = lookup(dict, keys);
    if (value === undefined) {
      value = lookup(translations[defaultLang], keys);
    }
    if (value === undefined) {
      return key as unknown as T;
    }
    if (typeof value === 'string' && replacements) {
      return applyReplacements(value, replacements) as unknown as T;
    }
    return value as T;
  };
}

const localeMap: Record<Lang, string> = {
  de: 'de-DE',
  en: 'en-GB',
  tr: 'tr-TR',
};

export function formatDate(date: Date | string, lang: Lang): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(localeMap[lang], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
