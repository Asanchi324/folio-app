import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';
import Nav from '@/components/Nav';

// Set NEXT_PUBLIC_GA_ID to your GA4 Measurement ID (looks like "G-XXXXXXXXXX")
// in .env.local. Left unset, analytics is simply not loaded.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://foli0.vercel.app';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Folio — build a portfolio that gets you admitted',
    template: '%s | Folio',
  },
  description:
    'Folio helps university applicants build a Common App–style academic portfolio, get honest AI feedback, see real admission chances, and discover the competitions and olympiads that will actually move the needle.',
  openGraph: {
    siteName: 'Folio',
    type: 'website',
    title: 'Folio — build a portfolio that gets you admitted',
    description:
      'Honest admissions intelligence: Common App–style portfolio, AI feedback with no glaze, real admission odds, and a Business Workspace for schools and counselors.',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: '#f6f4ee',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Days+One&family=Poppins:wght@600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
      </body>
    </html>
  );
}
