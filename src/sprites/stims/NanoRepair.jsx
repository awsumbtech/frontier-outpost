export default function NanoRepairSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Wrench */}
      <path d="M16 48 L36 28 L40 32 L20 52 Z" fill="#d1d5db" opacity="0.75" />
      <path d="M36 28 L38 22 L42 18 Q48 14 52 18 Q56 22 52 28 L48 32 L44 28 Z" fill="#d1d5db" opacity="0.65" />
      {/* Gear cog crossed */}
      <circle cx="24" cy="24" r="8" fill="none" stroke="#2ed573" strokeWidth="2.5" opacity="0.75" />
      <circle cx="24" cy="24" r="4" fill="#2ed573" opacity="0.55" />
      {/* Cog teeth */}
      <line x1="24" y1="14" x2="24" y2="18" stroke="#2ed573" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
      <line x1="24" y1="30" x2="24" y2="34" stroke="#2ed573" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
      <line x1="14" y1="24" x2="18" y2="24" stroke="#2ed573" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
      <line x1="30" y1="24" x2="34" y2="24" stroke="#2ed573" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
      {/* Nano sparkle dots */}
      <circle cx="42" cy="40" r="2" fill="#86efac" opacity="0.75" />
      <circle cx="48" cy="44" r="1.5" fill="#86efac" opacity="0.65" />
      <circle cx="38" cy="46" r="1.5" fill="#86efac" opacity="0.6" />
    </svg>
  );
}
