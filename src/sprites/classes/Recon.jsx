export default function ReconSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Cloak - angular flowing cape behind — intentionally lighter but bumped */}
      <path
        d="M18 16 L14 56 L8 58 L10 20 Z"
        fill="var(--sprite-primary, #ef4444)"
        opacity="0.5"
      />
      <path
        d="M20 18 L16 54 L10 56 L14 20 Z"
        fill="var(--sprite-primary, #ef4444)"
        opacity="0.38"
      />

      {/* Helmet - smooth, angular */}
      <path
        d="M26 6 L40 5 L42 14 L38 18 L26 18 L24 12 Z"
        fill="var(--sprite-primary, #ef4444)"
        opacity="0.85"
      />
      {/* Diagonal visor */}
      <line x1="28" y1="10" x2="40" y2="8" stroke="var(--sprite-highlight, #fca5a5)" strokeWidth="2" strokeLinecap="round" />
      {/* Crosshair detail near visor */}
      <circle cx="38" cy="9" r="2.5" fill="none" stroke="var(--sprite-highlight, #fca5a5)" strokeWidth="0.8" opacity="0.9" />

      {/* Lean torso - narrow, angular */}
      <path
        d="M26 18 L38 17 L40 38 L28 40 Z"
        fill="var(--sprite-primary, #ef4444)"
        opacity="0.75"
      />
      {/* Chest detail line */}
      <line x1="28" y1="24" x2="38" y2="23" stroke="var(--sprite-accent, #f87171)" strokeWidth="1" opacity="0.7" />

      {/* Left arm - compact sidearm held close */}
      <path
        d="M24 20 L26 19 L25 34 L22 34 Z"
        fill="var(--sprite-primary, #ef4444)"
        opacity="0.7"
      />
      {/* Sidearm */}
      <rect x="20" y="30" width="5" height="2.5" rx="0.5" fill="var(--sprite-accent, #f87171)" opacity="0.85" />

      {/* Right arm extended back with mono-blade */}
      <path
        d="M40 20 L44 18 L46 32 L42 34 Z"
        fill="var(--sprite-primary, #ef4444)"
        opacity="0.7"
      />
      {/* Mono-blade - slender, glowing edge */}
      <line x1="44" y1="16" x2="56" y2="6" stroke="var(--sprite-accent, #f87171)" strokeWidth="2" strokeLinecap="round" />
      <line x1="44" y1="16" x2="56" y2="6" stroke="var(--sprite-highlight, #fca5a5)" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />

      {/* Legs - lean, mid-stride */}
      <path
        d="M28 40 L33 40 L31 54 L26 54 Z"
        fill="var(--sprite-primary, #ef4444)"
        opacity="0.65"
      />
      <path
        d="M34 39 L40 38 L42 52 L36 54 Z"
        fill="var(--sprite-primary, #ef4444)"
        opacity="0.65"
      />
      {/* Boots - sleek */}
      <path d="M24 53 L32 53 L31 58 L24 58 Z" fill="var(--sprite-accent, #f87171)" opacity="0.7" />
      <path d="M35 53 L43 52 L43 57 L35 58 Z" fill="var(--sprite-accent, #f87171)" opacity="0.7" />
    </svg>
  );
}
