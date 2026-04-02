export default function FeralDroneSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Solid filled triangular head/body merge */}
      <path d="M24 20 L40 20 L36 12 L28 12 Z" fill="var(--sprite-primary, #7a859e)" opacity="0.85" />

      {/* Single red eye — slightly larger */}
      <circle cx="32" cy="17" r="2.5" fill="var(--sprite-highlight, #ff6b6b)" opacity="0.95" />

      {/* Solid filled thorax body */}
      <ellipse cx="32" cy="30" rx="7" ry="5" fill="var(--sprite-primary, #7a859e)" opacity="0.85" />

      {/* Thick filled wing polygons — upper pair */}
      <path d="M25 26 L10 14 L14 24 L25 30 Z" fill="var(--sprite-primary, #7a859e)" opacity="0.75" />
      <path d="M39 26 L54 14 L50 24 L39 30 Z" fill="var(--sprite-primary, #7a859e)" opacity="0.75" />

      {/* Lower wing pair — slightly smaller */}
      <path d="M25 32 L12 42 L17 38 L25 34 Z" fill="var(--sprite-accent, #9ca3af)" opacity="0.65" />
      <path d="M39 32 L52 42 L47 38 L39 34 Z" fill="var(--sprite-accent, #9ca3af)" opacity="0.65" />

      {/* Forward mandibles — bold enough to read at 16px */}
      <line x1="30" y1="13" x2="26" y2="8" stroke="var(--sprite-accent, #9ca3af)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="34" y1="13" x2="38" y2="8" stroke="var(--sprite-accent, #9ca3af)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

      {/* Simplified to 2 bold legs */}
      <line x1="28" y1="35" x2="22" y2="48" stroke="var(--sprite-primary, #7a859e)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="36" y1="35" x2="42" y2="48" stroke="var(--sprite-primary, #7a859e)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}
