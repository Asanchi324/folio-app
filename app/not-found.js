import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t('Page not found'), robots: { index: false } };
}

export default async function NotFound() {
  const { t } = await getT();
  return (
    <>
      <Nav />
      <main className="wrap nf">
        <p className="nf-code">404</p>
        <h1>{t('This page does not exist')}</h1>
        <p className="muted">
          {t('The link may be old or mistyped. Your portfolio is safe — here is where you can go instead.')}
        </p>
        <div className="nf-links">
          <Link href="/portfolio" className="btn btn-primary">{t('My portfolio')}</Link>
          <Link href="/universities" className="btn btn-ghost">{t('Universities')}</Link>
          <Link href="/" className="btn btn-ghost">{t('Home')}</Link>
        </div>
      </main>
      <Footer />
      <style>{`
        .nf{max-width:620px; padding-top:90px; padding-bottom:110px;}
        .nf-code{font-family:var(--display); font-size:15px; color:var(--primary-600); letter-spacing:.08em;}
        .nf h1{font-size:clamp(30px,5vw,44px); margin-top:10px;}
        .nf p.muted{font-size:16.5px; line-height:1.6; margin-top:14px;}
        .nf-links{display:flex; gap:10px; margin-top:28px; flex-wrap:wrap;}
      `}</style>
    </>
  );
}
