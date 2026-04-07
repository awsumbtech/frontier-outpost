export default function XenoStalkerSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Elongated head tapering to a point */}
      <path d="M30 4 L36 6 L38 14 L28 14 L26 8 Z" fill="var(--sprite-primary, #374151)" opacity="0.85" />
      {/* Two slitted eyes side-set */}
      <line x1="28" y1="10" x2="30" y2="9" stroke="var(--sprite-highlight, #ef4444)" strokeWidth="1.8" strokeLinecap="round" opacity="0.95" />
      <line x1="36" y1="9" x2="38" y2="10" stroke="var(--sprite-highlight, #ef4444)" strokeWidth="1.8" strokeLinecap="round" opacity="0.95" />

      {/* Thin torso */}
      <path d="M28 14 L38 14 L36 34 L30 34 Z" fill="var(--sprite-primary, #374151)" opacity="0.75" />
      {/* Camo dashes — consolidated to one bold side stripe */}
      <line x1="26" y1="18" x2="28" y2="18" stroke="var(--sprite-accent, #6b7280)" strokeWidth="1.2" strokeDasharray="2 1.5" opacity="0.65" />
      <line x1="26" y1="26" x2="28" y2="26" stroke="var(--sprite-accent, #6b7280)" strokeWidth="1.2" strokeDasharray="2 1.5" opacity="0.65" />

      {/* Left arm with blade-like forearm protrusion */}
      <path d="M26 16 L28 14 L26 28 L22 30 Z" fill="var(--sprite-primary, #374151)" opacity="0.7" />
      <path d="M20 28 L22 30 L14 22 Z" fill="var(--sprite-accent, #6b7280)" opacity="0.75" />

      {/* Right arm with blade */}
      <path d="M38 14 L40 16 L42 28 L38 30 Z" fill="var(--sprite-primary, #374151)" opacity="0.7" />
      <path d="M42 28 L44 30 L50 22 Z" fill="var(--sprite-accent, #6b7280)" opacity="0.75" />

      {/* Digitigrade legs (backward-bending knee) */}
      <path d="M30 34 L33 34 L28 44 L32 56 L28 56 L24 44 Z" fill="var(--sprite-primary, #374151)" opacity="0.7" />
      <path d="M34 34 L36 34 L40 44 L36 56 L32 56 L36 44 Z" fill="var(--sprite-primary, #374151)" opacity="0.7" />

      {/* Tail curving upward behind */}
      <path d="M33 34 Q26 42 20 38 Q16 36 12 28" fill="none" stroke="var(--sprite-primary, #374151)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <path d="M12 28 L10 24" fill="none" stroke="var(--sprite-accent, #6b7280)" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}
