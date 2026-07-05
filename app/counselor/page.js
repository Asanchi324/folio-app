'use client';

// Legacy route — the counselor dashboard grew into the Business Workspace.
// Old links and bookmarks land here; send them to /business (the student
// detail pages under /counselor/student/[uid] remain in place).

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CounselorRedirect() {
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
