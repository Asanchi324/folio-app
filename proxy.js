import { NextResponse } from 'next/server';
import { LANG_COOKIE, LANG_HEADER, isLang } from '@/lib/i18n-core';

// `?lang=ru|kk|en` serves the page in that language (crawlable per-language
// URLs for hreflang) and remembers it in the language cookie for later visits.
//
// Production *.vercel.app hosts (foli0.vercel.app, …) 308 to the real domain so
// visitors and search engines land on folioapply.com. Preview deployments keep
// their own URLs; /api is outside the matcher, so webhooks still reach any host.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.folioapply.com').replace(/\/$/, '');

export function proxy(request) {
  const host = request.headers.get('host') || '';
  if (process.env.VERCEL_ENV === 'production' && host.endsWith('.vercel.app')) {
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(SITE_URL + pathname + search, 308);
  }

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
