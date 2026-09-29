'use client';

// Language picker. `variant="segmented"` renders EN / RU / KZ inline (sidebar,
// footer); `variant="select"` is a compact native select (top nav on mobile).

import { LANGS } from '@/lib/i18n-core';
import { useT } from '@/lib/i18n';

export default function LangSwitch({ variant = 'segmented', className = '' }) {
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
