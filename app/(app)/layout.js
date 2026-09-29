import AppShell from '@/components/AppShell';

// App chrome: left sidebar (drawer on phones). Pages here are private to the
// student / workspace, so they stay out of search indexes.
export const metadata = { robots: { index: false, follow: false } };

export default function AppLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
