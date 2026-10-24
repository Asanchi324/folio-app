// Who runs Folio — shown on /terms, /privacy and /refunds. Fill in the
// registration fields once they exist (ИП / ТОО, БИН/ИИН, address); empty
// fields are simply not rendered, so the pages never show placeholders.

export const COMPANY = {
  name: 'Folio',
  legalName: '', // e.g. 'ИП Темирбеков А.' or 'ТОО «Folio»'
  regNumber: '', // БИН / ИИН
  address: '',
  country: 'Kazakhstan',
  email: 'temirbekov.assan@outlook.com',
};

// Rows for the "Company details" block: [label, value], only filled ones.
export function companyRows(t) {
  return [
    [t('Service'), COMPANY.name],
    [t('Operator'), COMPANY.legalName],
    [t('Registration number'), COMPANY.regNumber],
    [t('Address'), COMPANY.address],
    [t('Country'), t(COMPANY.country)],
    [t('Email'), COMPANY.email],
  ].filter(([, v]) => v);
}

// Server-rendered block shared by the legal pages.
export function CompanyDetails({ t }) {
  return (
    <section id="company">
      <h2>{t('Company details')}</h2>
      <dl className="legal-dl">
        {companyRows(t).map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{k === t('Email') ? <a className="link" href={`mailto:${v}`}>{v}</a> : v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// Links between the legal pages, shown at the bottom of each.
export const LEGAL_LINKS = [
  ['/privacy', 'Privacy policy'],
  ['/terms', 'Terms of use'],
  ['/refunds', 'Refund policy'],
  ['/privacy#cookies', 'Cookies'],
];

// Row of links at the bottom of each legal page.
export function LegalLinks({ t, current }) {
  return (
    <nav className="legal-links" aria-label={t('Legal')}>
      {LEGAL_LINKS.filter(([href]) => href !== current).map(([href, label]) => (
        <a key={href} className="link" href={href}>
          {t(label)}
        </a>
      ))}
    </nav>
  );
}
