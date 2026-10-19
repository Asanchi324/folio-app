// SEO: index the marketing + share surfaces, keep app/console routes out.
import { SITE_URL } from '@/lib/seo';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin', '/business', '/counselor', '/api/', '/portfolio', '/review', '/essay',
          '/advisor', '/deadlines', '/share', '/settings', '/join/', '/today', '/progress',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
