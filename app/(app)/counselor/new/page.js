'use client';

// Legacy route — workspace creation now lives in onboarding (/start?type=business).

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewOrgRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/start?type=business');
  }, [router]);
  return (
    <div className="page" style={{ textAlign: 'center' }}>
      <p className="muted">…</p>
    </div>
  );
}
