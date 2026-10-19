// Web app manifest — install prompt on phones, name/colours in search results.
export default function manifest() {
  return {
    name: 'Folio — admissions portfolio',
    short_name: 'Folio',
    description:
      'Build your admissions portfolio, get personal feedback, a daily plan and your chances at 800+ universities.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f4ee',
    theme_color: '#f6f4ee',
    lang: 'en',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
