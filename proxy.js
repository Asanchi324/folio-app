import { NextResponse } from 'next/server';
import { LANG_COOKIE, LANG_HEADER, isLang } from '@/lib/i18n-core';

// `?lang=ru|kk|en` serves the page in that language (crawlable per-language
// URLs for hreflang) and remembers it in the language cookie for later visits.
export function proxy(request) {
  const lang = request.nextUrl.searchParams.get('lang');
  if (!isLang(lang)) return NextResponse.next();

  const headers = new Headers(request.headers);
  headers.set(LANG_HEADER, lang);
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set(LANG_COOKIE, lang, { path: '/', maxAge: 31536000, sameSite: 'lax' });
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.(?:svg|png|jpg|ico|xml|txt|webmanifest)$).*)'],
};
