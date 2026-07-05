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
    <div className="wrap" style={{ padding: '80px 24px', textAlign: 'center' }}>
      <p className="muted">Opening your workspace…</p>
    </div>
  );
}
