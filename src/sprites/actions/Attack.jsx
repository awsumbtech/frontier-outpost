export default function AttackSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Two crossed angular sci-fi blades */}
      <line x1="8" y1="56" x2="56" y2="8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <line x1="8" y1="8" x2="56" y2="56" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      {/* Fuller lines on blades */}
      <line x1="12" y1="52" x2="52" y2="12" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
      <line x1="12" y1="12" x2="52" y2="52" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
      {/* Energy glow at intersection */}
      <circle cx="32" cy="32" r="5" fill="currentColor" opacity="0.45" />
      <circle cx="32" cy="32" r="2.5" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
