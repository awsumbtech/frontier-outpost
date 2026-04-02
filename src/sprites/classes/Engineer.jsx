export default function EngineerSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Hovering drone companion - above right shoulder */}
      <rect x="44" y="2" width="10" height="6" rx="1.5" fill="var(--sprite-accent, #fbbf24)" opacity="0.85" />
      <rect x="46" y="4" width="2" height="2" rx="0.5" fill="var(--sprite-highlight, #fde68a)" opacity="0.95" />
      {/* Drone rotor arms — bump to visible width */}
      <line x1="43" y1="5" x2="40" y2="5" stroke="var(--sprite-accent, #fbbf24)" strokeWidth="0.8" opacity="0.65" />
      <line x1="55" y1="5" x2="57" y2="5" stroke="var(--sprite-accent, #fbbf24)" strokeWidth="0.8" opacity="0.65" />
      {/* Drone hover glow */}
      <ellipse cx="49" cy="9" rx="4" ry="1" fill="var(--sprite-highlight, #fde68a)" opacity="0.45" />

      {/* Helmet - wide-brim technical visor */}
      <path
        d="M22 10 L40 9 L42 16 L38 20 L24 20 L20 16 Z"
        fill="var(--sprite-primary, #f59e0b)"
        opacity="0.85"
      />
      {/* Wide visor band */}
      <path
        d="M22 13 L40 12 L40 15 L22 16 Z"
        fill="var(--sprite-highlight, #fde68a)"
        opacity="0.9"
      />
      {/* Monocle detail */}
      <circle cx="37" cy="14" r="2" fill="none" stroke="var(--sprite-highlight, #fde68a)" strokeWidth="1" opacity="0.8" />

      {/* Torso - medium build with tech panels */}
      <path
        d="M24 20 L40 19 L42 40 L26 42 Z"
        fill="var(--sprite-primary, #f59e0b)"
        opacity="0.75"
      />
      {/* Chest armor panels with circular ports */}
      <rect x="28" y="24" width="10" height="6" rx="1" fill="none" stroke="var(--sprite-accent, #fbbf24)" strokeWidth="1" opacity="0.8" />
      <circle cx="30" cy="27" r="1.2" fill="var(--sprite-highlight, #fde68a)" opacity="0.75" />
      <circle cx="36" cy="27" r="1.2" fill="var(--sprite-highlight, #fde68a)" opacity="0.75" />

      {/* Tool belt at waist */}
      <rect x="26" y="38" width="16" height="4" rx="0.5" fill="var(--sprite-accent, #fbbf24)" opacity="0.65" />
      <rect x="28" y="39" width="2.5" height="2" rx="0.3" fill="var(--sprite-primary, #f59e0b)" opacity="0.8" />
      <rect x="32" y="39" width="2.5" height="2" rx="0.3" fill="var(--sprite-primary, #f59e0b)" opacity="0.8" />
      <rect x="36" y="39" width="2.5" height="2" rx="0.3" fill="var(--sprite-primary, #f59e0b)" opacity="0.8" />

      {/* Left arm - oversized arc welder gauntlet */}
      <path
        d="M22 22 L24 20 L23 36 L18 38 Z"
        fill="var(--sprite-primary, #f59e0b)"
        opacity="0.7"
      />
      {/* Gauntlet - bulky */}
      <path
        d="M14 34 L22 32 L22 40 L14 40 Z"
        fill="var(--sprite-accent, #fbbf24)"
        opacity="0.8"
      />
      <line x1="15" y1="36" x2="21" y2="35" stroke="var(--sprite-highlight, #fde68a)" strokeWidth="0.8" opacity="0.7" />

      {/* Right arm - holding datapad */}
      <path
        d="M40 21 L44 20 L46 34 L42 36 Z"
        fill="var(--sprite-primary, #f59e0b)"
        opacity="0.7"
      />
      {/* Datapad */}
      <rect x="44" y="30" width="6" height="8" rx="0.8" fill="var(--sprite-accent, #fbbf24)" opacity="0.75" />
      <rect x="45" y="31" width="4" height="5" rx="0.3" fill="var(--sprite-highlight, #fde68a)" opacity="0.55" />

      {/* Legs */}
      <path
        d="M28 42 L34 42 L34 54 L28 54 Z"
        fill="var(--sprite-primary, #f59e0b)"
        opacity="0.65"
      />
      <path
        d="M35 42 L42 41 L42 53 L35 54 Z"
        fill="var(--sprite-primary, #f59e0b)"
        opacity="0.65"
      />
      {/* Boots */}
      <rect x="26" y="53" width="9" height="4" rx="1" fill="var(--sprite-accent, #fbbf24)" opacity="0.7" />
      <rect x="34" y="53" width="9" height="4" rx="1" fill="var(--sprite-accent, #fbbf24)" opacity="0.7" />
    </svg>
  );
}
