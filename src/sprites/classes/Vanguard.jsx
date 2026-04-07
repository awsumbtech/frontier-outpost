export default function VanguardSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Shield - hexagonal riot shield, left side */}
      <path
        d="M12 16 L26 10 L26 52 L12 46 L8 31 Z"
        fill="var(--sprite-primary, #3b82f6)"
        opacity="0.9"
      />
      <path
        d="M14 20 L24 15 L24 47 L14 43 L11 31 Z"
        fill="none"
        stroke="var(--sprite-accent, #60a5fa)"
        strokeWidth="1"
      />
      {/* Shield panel lines */}
      <line x1="13" y1="28" x2="24" y2="25" stroke="var(--sprite-accent, #60a5fa)" strokeWidth="0.8" opacity="0.7" />
      <line x1="13" y1="34" x2="24" y2="31" stroke="var(--sprite-accent, #60a5fa)" strokeWidth="0.8" opacity="0.7" />
      {/* Shield chevron emblem */}
      <path d="M16 30 L19 27 L22 30" fill="none" stroke="var(--sprite-highlight, #93c5fd)" strokeWidth="1.2" opacity="0.85" />

      {/* Body - heavy power armor torso */}
      <path
        d="M28 18 L42 16 L46 24 L44 44 L28 46 Z"
        fill="var(--sprite-primary, #3b82f6)"
        opacity="0.8"
      />
      {/* Chest armor plate */}
      <path
        d="M30 22 L40 20 L42 28 L40 38 L30 40 Z"
        fill="none"
        stroke="var(--sprite-accent, #60a5fa)"
        strokeWidth="1.2"
        opacity="0.85"
      />

      {/* Helmet */}
      <path
        d="M30 8 L42 7 L44 16 L40 19 L30 20 L28 16 Z"
        fill="var(--sprite-primary, #3b82f6)"
        opacity="0.88"
      />
      {/* Visor slit - horizontal glowing line */}
      <line x1="31" y1="13" x2="42" y2="12" stroke="var(--sprite-highlight, #93c5fd)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Left pauldron (shield arm, higher) */}
      <path
        d="M24 14 L30 11 L30 20 L24 22 Z"
        fill="var(--sprite-primary, #3b82f6)"
        opacity="0.85"
      />
      {/* Right pauldron (slightly lower) */}
      <path
        d="M42 13 L50 11 L52 18 L46 20 Z"
        fill="var(--sprite-primary, #3b82f6)"
        opacity="0.85"
      />

      {/* Right arm */}
      <path
        d="M46 22 L52 20 L54 34 L48 36 Z"
        fill="var(--sprite-primary, #3b82f6)"
        opacity="0.7"
      />
      {/* Fist */}
      <rect x="48" y="36" width="6" height="5" rx="1" fill="var(--sprite-accent, #60a5fa)" opacity="0.8" />

      {/* Legs - thick power armor */}
      <path
        d="M30 44 L36 44 L37 56 L30 56 Z"
        fill="var(--sprite-primary, #3b82f6)"
        opacity="0.7"
      />
      <path
        d="M38 44 L44 44 L44 56 L37 56 Z"
        fill="var(--sprite-primary, #3b82f6)"
        opacity="0.7"
      />
      {/* Boots */}
      <rect x="28" y="55" width="9" height="4" rx="1" fill="var(--sprite-accent, #60a5fa)" opacity="0.75" />
      <rect x="36" y="55" width="9" height="4" rx="1" fill="var(--sprite-accent, #60a5fa)" opacity="0.75" />
    </svg>
  );
}
