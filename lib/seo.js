// SEO helpers shared by metadata, sitemap, robots and JSON-LD.
//
// Languages share one URL and are picked by cookie, so search engines would
// only ever see English. `?lang=ru` / `?lang=kk` give each language its own
// crawlable URL (proxy.js turns the param into the active language); every
// public page lists all three as hreflang alternates.
import { getLang } from '@/lib/i18n-server';
import { LANGS } from '@/lib/i18n-core';

// Canonical production origin. folioapply.com 308s to www, so www is canonical.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.folioapply.com').replace(/\/$/, '');

export const SITE_NAME = 'Folio';

export function langPath(path, lang) {
  return lang === 'en' ? path : `${path}?lang=${lang}`;
}

export function languageAlternates(path, absolute = false) {
  const base = absolute ? SITE_URL : '';
  const out = {};
  for (const l of LANGS) out[l.htmlLang] = base + langPath(path, l.code);
  out['x-default'] = base + path;
  return out;
}

// `alternates` for a public page: canonical in the language being served,
// plus hreflang links to the other two.
export async function pageAlternates(path) {
  const lang = await getLang();
  return { canonical: langPath(path, lang), languages: languageAlternates(path) };
}

export function ogLocale(lang) {
  return lang === 'ru' ? 'ru_RU' : lang === 'kk' ? 'kk_KZ' : 'en_US';
}
