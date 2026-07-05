// SEO: index the marketing + share surfaces, keep app/console routes out.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://foli0.vercel.app';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/business', '/counselor', '/api/', '/portfolio/print'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
