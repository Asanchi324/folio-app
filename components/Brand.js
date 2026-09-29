// Folio logo mark — blue folder with a white page (from the brand deck).
export function BrandMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path
        d="M8 20c0-2.2 1.8-4 4-4h9.8c1.1 0 2.1.45 2.85 1.25l2.5 2.6c.38.4.9.62 1.45.62H52c2.2 0 4 1.8 4 4v21c0 2.2-1.8 4-4 4H12c-2.2 0-4-1.8-4-4V20Z"
        fill="var(--primary)"
      />
      <path d="M8 24.8h48V25c0-2.2-1.8-4-4-4H28.5V24.8H8Z" fill="#3a76c8" />
      <g transform="rotate(-8 26 38)">
        <rect x="12" y="27" width="29" height="21" rx="2.4" fill="#fff" />
        <rect x="17" y="33" width="19" height="3.1" rx="1.55" fill="var(--primary)" />
        <rect x="17" y="38.6" width="14" height="3.1" rx="1.55" fill="var(--primary)" />
        <rect x="17" y="44.2" width="9.5" height="3.1" rx="1.55" fill="var(--primary)" />
      </g>
    </svg>
  );
}
