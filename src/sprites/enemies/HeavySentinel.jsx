export default function HeavySentinelSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Tiny head recessed into shoulders */}
      <rect x="27" y="4" width="10" height="7" rx="2" fill="var(--sprite-primary, #6b7280)" opacity="0.8" />
      <circle cx="30" cy="8" r="1" fill="var(--sprite-highlight, #ef4444)" opacity="0.9" />
      <circle cx="34" cy="8" r="1" fill="var(--sprite-highlight, #ef4444)" opacity="0.9" />

      {/* Massive inverted-trapezoid torso */}
      <path d="M14 12 L50 12 L46 42 L18 42 Z" fill="var(--sprite-primary, #6b7280)" opacity="0.8" />
      {/* Layered armor plates — 3 horizontal bands */}
      <rect x="18" y="16" width="28" height="6" rx="0.5" fill="var(--sprite-accent, #374151)" opacity="0.6" />
      <rect x="18" y="24" width="28" height="6" rx="0.5" fill="var(--sprite-accent, #374151)" opacity="0.55" />
      <rect x="18" y="32" width="28" height="6" rx="0.5" fill="var(--sprite-accent, #374151)" opacity="0.5" />
      {/* Plate edge lines — consolidated to single bold line */}
      <line x1="18" y1="22" x2="46" y2="22" stroke="var(--sprite-highlight, #9ca3af)" strokeWidth="0.8" opacity="0.6" />
      <line x1="18" y1="30" x2="46" y2="30" stroke="var(--sprite-highlight, #9ca3af)" strokeWidth="0.8" opacity="0.6" />

      {/* Enormous left arm — flat plate hand */}
      <path d="M12 14 L14 12 L12 34 L6 36 Z" fill="var(--sprite-primary, #6b7280)" opacity="0.75" />
      <rect x="2" y="34" width="10" height="8" rx="1.5" fill="var(--sprite-accent, #9ca3af)" opacity="0.7" />

      {/* Enormous right arm — flat plate hand */}
      <path d="M50 12 L52 14 L54 34 L48 36 Z" fill="var(--sprite-primary, #6b7280)" opacity="0.75" />
      <rect x="48" y="34" width="10" height="8" rx="1.5" fill="var(--sprite-accent, #9ca3af)" opacity="0.7" />

      {/* Short thick pylon legs */}
      <rect x="20" y="42" width="9" height="14" rx="2" fill="var(--sprite-primary, #6b7280)" opacity="0.7" />
      <rect x="35" y="42" width="9" height="14" rx="2" fill="var(--sprite-primary, #6b7280)" opacity="0.7" />
      {/* Feet */}
      <rect x="18" y="55" width="13" height="4" rx="1.5" fill="var(--sprite-accent, #9ca3af)" opacity="0.65" />
      <rect x="33" y="55" width="13" height="4" rx="1.5" fill="var(--sprite-accent, #9ca3af)" opacity="0.65" />
    </svg>
  );
}
