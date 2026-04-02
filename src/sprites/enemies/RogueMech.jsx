export default function RogueMechSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Boxy torso */}
      <rect x="20" y="18" width="24" height="22" rx="2" fill="var(--sprite-primary, #4b5563)" opacity="0.85" />
      {/* Rectangular visor with glitching scan line */}
      <rect x="24" y="8" width="16" height="10" rx="1.5" fill="var(--sprite-primary, #4b5563)" opacity="0.85" />
      <rect x="26" y="11" width="12" height="4" rx="0.5" fill="var(--sprite-accent, #fbbf24)" opacity="0.8" />
      <line x1="26" y1="14" x2="38" y2="13.5" stroke="var(--sprite-highlight, #fde68a)" strokeWidth="1" opacity="0.9" />

      {/* Warning triangle on chest */}
      <path d="M30 26 L34 26 L32 22 Z" fill="var(--sprite-accent, #fbbf24)" opacity="0.75" />

      {/* Narrow waist */}
      <rect x="28" y="40" width="8" height="4" rx="1" fill="var(--sprite-accent, #6b7280)" opacity="0.75" />

      {/* Left arm — welding arm (pointed) */}
      <path d="M18 22 L20 20 L18 36 L14 38 Z" fill="var(--sprite-primary, #4b5563)" opacity="0.75" />
      <path d="M12 38 L16 36 L10 48 Z" fill="var(--sprite-accent, #fbbf24)" opacity="0.75" />
      {/* Weld spark */}
      <circle cx="10" cy="48" r="1.5" fill="var(--sprite-highlight, #fde68a)" opacity="0.85" />

      {/* Right arm — pile driver (flat hammer) — fixed duplicate d attribute */}
      <path d="M44 22 L46 20 L48 36 L44 38 Z" fill="var(--sprite-primary, #4b5563)" opacity="0.75" />
      <rect x="44" y="36" width="10" height="5" rx="1" fill="var(--sprite-accent, #6b7280)" opacity="0.8" />

      {/* Heavy legs — short pylons */}
      <rect x="22" y="44" width="7" height="12" rx="1.5" fill="var(--sprite-primary, #4b5563)" opacity="0.75" />
      <rect x="35" y="44" width="7" height="12" rx="1.5" fill="var(--sprite-primary, #4b5563)" opacity="0.75" />
      {/* Feet */}
      <rect x="20" y="55" width="11" height="3" rx="1" fill="var(--sprite-accent, #6b7280)" opacity="0.7" />
      <rect x="33" y="55" width="11" height="3" rx="1" fill="var(--sprite-accent, #6b7280)" opacity="0.7" />
    </svg>
  );
}
