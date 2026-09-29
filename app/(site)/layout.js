import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

// Public site chrome: top navigation + footer.
export default function SiteLayout({ children }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
