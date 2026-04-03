export default function AdrenalineSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Pill capsule base */}
      <rect x="20" y="34" width="24" height="14" rx="7" fill="#ffa502" opacity="0.65" />
      <rect x="22" y="36" width="20" height="10" rx="5" fill="none" stroke="#ffa502" strokeWidth="1.2" opacity="0.55" />
      {/* Upward arrow emerging */}
      <line x1="32" y1="32" x2="32" y2="10" stroke="#ffa502" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
      <path d="M24 18 L32 8 L40 18" fill="none" stroke="#ffa502" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      {/* Speed lines behind arrow */}
      <line x1="20" y1="16" x2="20" y2="24" stroke="#ffa502" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      <line x1="44" y1="16" x2="44" y2="24" stroke="#ffa502" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
