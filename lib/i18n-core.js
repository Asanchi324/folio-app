// Folio i18n — shared core (server + client).
//
// Keys ARE the English source strings: `t('Your portfolio')`. English needs no
// dictionary, and a missing translation falls back to readable English instead
// of a raw key. Dictionaries live in lib/locales/{ru,kk}.js as plain
// { 'English': 'Перевод' } maps. `{name}` placeholders are interpolated.
//
// The active language lives in the `folio_lang` cookie (1 year, first-party,
// functional — no consent needed). The root layout reads it on the server and
// hands ONLY that language's dictionary to the client provider (dictionaries
// are imported server-side only, in lib/i18n-server.js), so the client bundle
// never carries every language, and switching is a cookie write + refresh.

export const LANGS = [
  { code: 'en', label: 'English', short: 'EN', htmlLang: 'en' },
  { code: 'ru', label: 'Русский', short: 'RU', htmlLang: 'ru' },
  { code: 'kk', label: 'Қазақша', short: 'KZ', htmlLang: 'kk' },
];

export const DEFAULT_LANG = 'en';
export const LANG_COOKIE = 'folio_lang';
// Set by proxy.js from a `?lang=` URL param; wins over the cookie.
export const LANG_HEADER = 'x-folio-lang';

export function isLang(code) {
  return LANGS.some((l) => l.code === code);
}

// Best guess from an Accept-Language header when no cookie is set yet.
export function langFromAcceptLanguage(header = '') {
  const h = String(header).toLowerCase();
  const tags = h.split(',').map((p) => p.split(';')[0].trim());
  for (const tag of tags) {
    if (tag.startsWith('kk')) return 'kk';
    if (tag.startsWith('ru')) return 'ru';
    if (tag.startsWith('en')) return 'en';
  }
  return DEFAULT_LANG;
}

function interpolate(s, vars) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : String(vars[k])));
}

// Build a t() for a dictionary. Works identically on server and client.
export function makeT(dict) {
  return function t(key, vars) {
    const hit = dict && Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : key;
    return interpolate(hit, vars);
  };
}

// Locale for Intl date/number formatting.
export function intlLocale(lang) {
  return lang === 'ru' ? 'ru-RU' : lang === 'kk' ? 'kk-KZ' : 'en-GB';
}

// Name of the language for AI prompts ("Answer in …").
export function aiLanguageName(lang) {
  return lang === 'ru' ? 'Russian' : lang === 'kk' ? 'Kazakh' : 'English';
}
