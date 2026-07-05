import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap" style={{ maxWidth: 520, padding: '90px 24px 140px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--display)', fontSize: 72, color: 'var(--primary)', lineHeight: 1 }}>404</div>
      <h1 style={{ fontSize: 28, marginTop: 14 }}>This page didn’t get in.</h1>
      <p className="muted" style={{ marginTop: 12, fontSize: 15.5, lineHeight: 1.6 }}>
        The link may be old or mistyped. Your portfolio, though, is exactly
        where you left it.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 26, flexWrap: 'wrap' }}>
        <Link href="/portfolio" className="btn btn-primary">My portfolio</Link>
        <Link href="/" className="btn btn-ghost">Home</Link>
      </div>
    </div>
  );
}
