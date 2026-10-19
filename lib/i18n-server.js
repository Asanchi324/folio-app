// Server-side language resolution for server components and metadata.
import { cookies, headers } from 'next/headers';
import { LANG_COOKIE, LANG_HEADER, isLang, langFromAcceptLanguage, makeT } from '@/lib/i18n-core';
import ru from '@/lib/locales/ru';
import kk from '@/lib/locales/kk';

const DICTS = { en: null, ru, kk };

export function dictFor(lang) {
  return DICTS[lang] || null;
}

export async function getLang() {
  const h = await headers();
  const fromUrl = h.get(LANG_HEADER);
  if (isLang(fromUrl)) return fromUrl;
  const jar = await cookies();
  const fromCookie = jar.get(LANG_COOKIE)?.value;
  if (isLang(fromCookie)) return fromCookie;
  return langFromAcceptLanguage(h.get('accept-language') || '');
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: makeT(dictFor(lang)) };
}
