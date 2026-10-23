import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';

// Public site chrome: top navigation + footer.
export default function SiteLayout({ children }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
      <SmoothScroll />
    </>
  );
}
