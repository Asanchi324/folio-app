'use client';

// Circular progress ring used for profile strength and admission chances.
export default function Ring({
  value = 0,
  size = 120,
  stroke = 10,
  color = 'var(--primary)',
  track = 'var(--line)',
  label,
  sublabel,
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--display)',
            fontSize: size * 0.27,
            fontWeight: 600,
            lineHeight: 1,
            color: 'var(--ink)',
          }}
        >
          {label}
        </span>
        {sublabel && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginTop: 4,
            }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
