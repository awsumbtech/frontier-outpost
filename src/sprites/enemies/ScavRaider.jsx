export default function ScavRaiderSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Head with bandana mask */}
      <path d="M28 8 L36 7 L38 14 L26 15 Z" fill="var(--sprite-primary, #9ca3af)" opacity="0.85" />
      {/* Eyes above mask */}
      <circle cx="30" cy="10" r="1" fill="var(--sprite-highlight, #d1d5db)" opacity="0.9" />
      <circle cx="34" cy="10" r="1" fill="var(--sprite-highlight, #d1d5db)" opacity="0.9" />
      {/* Bandana */}
      <path d="M26 12 L38 11 L38 15 L26 15 Z" fill="var(--sprite-accent, #6b7280)" opacity="0.75" />

      {/* Mismatched armor — one big shoulder pad */}
      <path d="M22 16 L28 14 L28 22 L20 24 Z" fill="var(--sprite-accent, #fbbf24)" opacity="0.75" />
      {/* Small shoulder pad on right */}
      <rect x="36" y="15" width="5" height="4" rx="0.5" fill="var(--sprite-accent, #6b7280)" opacity="0.65" />

      {/* Hunched torso */}
      <path d="M26 16 L38 15 L40 38 L24 40 Z" fill="var(--sprite-primary, #9ca3af)" opacity="0.7" />
      {/* Chest patch — bump stroke width to be visible */}
      <rect x="29" y="22" width="6" height="4" rx="0.5" fill="none" stroke="var(--sprite-accent, #6b7280)" strokeWidth="1" opacity="0.65" />

      {/* Left arm */}
      <path d="M22 24 L26 18 L24 36 L20 38 Z" fill="var(--sprite-primary, #9ca3af)" opacity="0.65" />

      {/* Right arm holding makeshift rifle */}
      <path d="M38 18 L42 16 L44 32 L40 34 Z" fill="var(--sprite-primary, #9ca3af)" opacity="0.65" />
      {/* Rifle — asymmetric */}
      <rect x="42" y="24" width="14" height="2.5" rx="0.5" fill="var(--sprite-accent, #6b7280)" opacity="0.8" />
      <rect x="44" y="22" width="3" height="2" rx="0.3" fill="var(--sprite-primary, #4b5563)" opacity="0.75" />
      <rect x="52" y="23" width="4" height="1.5" rx="0.3" fill="var(--sprite-highlight, #9ca3af)" opacity="0.65" />

      {/* Legs — aggressive stance */}
      <path d="M26 40 L32 40 L30 54 L24 54 Z" fill="var(--sprite-primary, #9ca3af)" opacity="0.65" />
      <path d="M34 39 L40 38 L42 52 L36 54 Z" fill="var(--sprite-primary, #9ca3af)" opacity="0.65" />
      {/* Boots */}
      <rect x="22" y="53" width="9" height="3" rx="0.5" fill="var(--sprite-accent, #6b7280)" opacity="0.65" />
      <rect x="35" y="53" width="8" height="3" rx="0.5" fill="var(--sprite-accent, #6b7280)" opacity="0.65" />
    </svg>
  );
}
