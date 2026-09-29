'use client';

// Client side of Folio i18n. The provider receives the active language and
// its dictionary from the root layout (server), so there is no flash of
// English on load. setLang() writes the cookie and refreshes server output.

import { createContext, useCallback, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LANG_COOKIE, makeT, intlLocale } from '@/lib/i18n-core';

const I18nContext = createContext({ lang: 'en', t: makeT(null), setLang: () => {} });

export function I18nProvider({ lang, dict, children }) {
  const router = useRouter();
  const t = useMemo(() => makeT(dict), [dict]);

  const setLang = useCallback(
    (next) => {
      if (next === lang) return;
      // 1 year, first-party, Lax — a functional preference cookie.
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax${
        location.protocol === 'https:' ? '; secure' : ''
      }`;
      document.documentElement.lang = next;
      router.refresh();
    },
    [lang, router]
  );

  const value = useMemo(() => ({ lang, t, setLang, locale: intlLocale(lang) }), [lang, t, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  return useContext(I18nContext);
}
