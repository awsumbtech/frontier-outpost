export default function HealthStimSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Syringe body angled 45 degrees */}
      <rect x="18" y="28" width="28" height="8" rx="2" fill="#d1d5db" opacity="0.75" transform="rotate(-45 32 32)" />
      {/* Liquid level inside */}
      <rect x="18" y="30" width="18" height="4" rx="1" fill="#2ed573" opacity="0.8" transform="rotate(-45 32 32)" />
      {/* Plunger top */}
      <rect x="44" y="30" width="8" height="4" rx="1" fill="#9ca3af" opacity="0.65" transform="rotate(-45 32 32)" />
      {/* Needle tip */}
      <line x1="16" y1="48" x2="10" y2="54" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      {/* Cross indicator */}
      <line x1="30" y1="18" x2="30" y2="26" stroke="#2ed573" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
      <line x1="26" y1="22" x2="34" y2="22" stroke="#2ed573" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}
