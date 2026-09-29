import { ImageResponse } from 'next/og';

// Default social preview (Telegram / WhatsApp / Instagram link cards).
export const alt = 'Folio — admissions portfolio, honest AI review and real chances';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#f6f4ee',
          color: '#1b1a24',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 44, fontWeight: 800 }}>
          <div style={{ width: 56, height: 44, borderRadius: 8, background: '#4585d9' }} />
          Folio
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }}>
            Know exactly where you stand.
          </div>
          <div style={{ fontSize: 32, color: '#3a3946', lineHeight: 1.35, maxWidth: 940 }}>
            Build your portfolio · personal feedback · a daily plan · chances at 800+ universities
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 24, color: '#6b6977' }}>
          English · Русский · Қазақша
        </div>
      </div>
    ),
    size
  );
}
