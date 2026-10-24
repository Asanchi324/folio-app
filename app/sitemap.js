// Sitemap for the public marketing surfaces, with hreflang alternates for the
// ?lang= language versions. Share pages (/p/*) are intentionally excluded —
// they're unlisted-by-link, not discoverable content.
import { SITE_URL, languageAlternates } from '@/lib/seo';

const PAGES = [
  ['/', 'weekly', 1],
  ['/universities', 'weekly', 0.9],
  ['/discover', 'weekly', 0.9],
  ['/upgrade', 'monthly', 0.7],
  ['/privacy', 'yearly', 0.2],
  ['/terms', 'yearly', 0.2],
  ['/refunds', 'yearly', 0.2],
];

export default function sitemap() {
  const now = new Date();
  return PAGES.map(([path, changeFrequency, priority]) => ({
    url: SITE_URL + path,
    lastModified: now,
    changeFrequency,
    priority,
    alternates: { languages: languageAlternates(path, true) },
  }));
}
