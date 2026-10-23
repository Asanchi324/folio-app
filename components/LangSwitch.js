'use client';

// Language picker. `variant="text"` is the quiet default — "EN · RU · KZ" in
// small muted type (footer, sidebar foot); `variant="segmented"` is the boxed
// control (Settings); `variant="select"` is a compact native select.

import { LANGS } from '@/lib/i18n-core';
import { useT } from '@/lib/i18n';

export default function LangSwitch({ variant = 'text', className = '' }) {
  const { lang, setLang, t } = useT();

  if (variant === 'select') {
    return (
      <select
        className={`lang-select ${className}`}
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        aria-label={t('Language')}
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.short}
          </option>
        ))}
      </select>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`lang-text ${className}`} role="group" aria-label={t('Language')}>
        {LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            aria-pressed={lang === l.code}
            title={l.label}
            className={lang === l.code ? 'on' : ''}
          >
            {l.short}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`lang-seg ${className}`} role="group" aria-label={t('Language')}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          title={l.label}
          className={lang === l.code ? 'on' : ''}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
