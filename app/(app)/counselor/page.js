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
    <div className="page" style={{ textAlign: 'center' }}>
      <p className="muted">…</p>
    </div>
  );
}
