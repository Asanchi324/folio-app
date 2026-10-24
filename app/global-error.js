'use client';

// Last-resort boundary (root layout failed). Must render its own <html>; no
// providers are available here, so it stays in plain English + Russian.
export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#f6f4ee', color: '#1b1a24', margin: 0 }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '90px 20px' }}>
          <h1 style={{ fontSize: 30, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: '#6b6977', lineHeight: 1.6 }}>Что-то пошло не так. Your data is saved — please try again.</p>
          <button onClick={() => reset()} style={{ marginTop: 16, padding: '10px 18px', borderRadius: 10, border: 0, background: '#3670bc', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
