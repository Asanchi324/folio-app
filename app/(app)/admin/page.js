'use client';

// Legacy route — the org-admin overview merged into the Business Workspace
// (/business). Old links land here; founders' console stays at /admin/orgs.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/business');
  }, [router]);
  return (
    <div className="page" style={{ textAlign: 'center' }}>
      <p className="muted">…</p>
    </div>
  );
}
