import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';
import { getT } from '@/lib/i18n-server';

// Public site chrome: top navigation + footer.
export default async function SiteLayout({ children }) {
  const { t } = await getT();
  return (
    <>
      <a href="#main" className="skip-link">{t('Skip to content')}</a>
      <Nav />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer />
      <SmoothScroll />
    </>
  );
}
