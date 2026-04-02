export default function MedicSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Medical backpack with twin antenna probes */}
      <rect x="22" y="14" width="12" height="18" rx="2" fill="var(--sprite-primary, #22c55e)" opacity="0.65" />
      {/* Antenna probe left */}
      <line x1="24" y1="14" x2="22" y2="4" stroke="var(--sprite-accent, #4ade80)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="22" cy="3" r="1.5" fill="var(--sprite-highlight, #86efac)" opacity="0.9" />
      {/* Antenna probe right */}
      <line x1="32" y1="14" x2="34" y2="4" stroke="var(--sprite-accent, #4ade80)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="34" cy="3" r="1.5" fill="var(--sprite-highlight, #86efac)" opacity="0.9" />
      {/* Backpack cross symbol */}
      <line x1="28" y1="20" x2="28" y2="28" stroke="var(--sprite-highlight, #86efac)" strokeWidth="2" opacity="0.8" />
      <line x1="24" y1="24" x2="32" y2="24" stroke="var(--sprite-highlight, #86efac)" strokeWidth="2" opacity="0.8" />

      {/* Healing pulse arcs — keep single, make it visible */}
      <path d="M18 18 Q14 24 18 30" fill="none" stroke="var(--sprite-highlight, #86efac)" strokeWidth="1" opacity="0.55" />

      {/* Helmet - rounded with cross-shaped visor */}
      <path
        d="M30 8 L44 7 L46 14 L44 18 L32 19 L30 14 Z"
        fill="var(--sprite-primary, #22c55e)"
        opacity="0.85"
      />
      {/* Cross visor */}
      <line x1="35" y1="10" x2="43" y2="9" stroke="var(--sprite-highlight, #86efac)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="39" y1="7" x2="39" y2="14" stroke="var(--sprite-highlight, #86efac)" strokeWidth="1.8" strokeLinecap="round" />

      {/* Torso - medium-light build */}
      <path
        d="M32 19 L44 18 L46 40 L34 42 Z"
        fill="var(--sprite-primary, #22c55e)"
        opacity="0.75"
      />
      {/* Chest detail — consolidated to one visible line */}
      <line x1="35" y1="29" x2="43" y2="28" stroke="var(--sprite-accent, #4ade80)" strokeWidth="1" opacity="0.65" />

      {/* Left arm - holds compact energy shield */}
      <path
        d="M30 20 L32 19 L31 34 L28 36 Z"
        fill="var(--sprite-primary, #22c55e)"
        opacity="0.7"
      />
      {/* Small shield */}
      <path
        d="M22 30 L28 28 L28 38 L22 36 L21 33 Z"
        fill="var(--sprite-accent, #4ade80)"
        opacity="0.65"
      />

      {/* Right arm extended with bio-injector */}
      <path
        d="M44 20 L48 19 L50 32 L46 34 Z"
        fill="var(--sprite-primary, #22c55e)"
        opacity="0.7"
      />
      {/* Bio-injector device */}
      <rect x="48" y="28" width="10" height="3" rx="1" fill="var(--sprite-accent, #4ade80)" opacity="0.8" />
      <line x1="58" y1="29.5" x2="60" y2="29.5" stroke="var(--sprite-highlight, #86efac)" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      {/* Injector glow tip */}
      <circle cx="60" cy="29.5" r="1.2" fill="var(--sprite-highlight, #86efac)" opacity="0.8" />

      {/* Legs */}
      <path
        d="M34 42 L40 42 L40 54 L34 54 Z"
        fill="var(--sprite-primary, #22c55e)"
        opacity="0.65"
      />
      <path
        d="M41 41 L46 40 L46 53 L41 54 Z"
        fill="var(--sprite-primary, #22c55e)"
        opacity="0.65"
      />
      {/* Boots */}
      <rect x="32" y="53" width="9" height="4" rx="1" fill="var(--sprite-accent, #4ade80)" opacity="0.7" />
      <rect x="40" y="53" width="7" height="4" rx="1" fill="var(--sprite-accent, #4ade80)" opacity="0.7" />
    </svg>
  );
}
