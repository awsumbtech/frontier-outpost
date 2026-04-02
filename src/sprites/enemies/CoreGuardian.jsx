export default function CoreGuardianSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Small dome head */}
      <ellipse cx="32" cy="6" rx="5" ry="4" fill="var(--sprite-primary, #1e293b)" opacity="0.85" />
      {/* Single vertical eye slit */}
      <line x1="32" y1="4" x2="32" y2="8" stroke="var(--sprite-highlight, #00d4ff)" strokeWidth="1.5" strokeLinecap="round" opacity="0.95" />

      {/* Torso with large central core */}
      <path d="M20 10 L44 10 L46 40 L18 40 Z" fill="var(--sprite-primary, #1e293b)" opacity="0.8" />
      {/* Central glowing core — keep glow effect slightly more transparent but bumped */}
      <circle cx="32" cy="25" r="8" fill="var(--sprite-accent, #0e7490)" opacity="0.55" />
      <circle cx="32" cy="25" r="6" fill="var(--sprite-highlight, #00d4ff)" opacity="0.45" />
      <circle cx="32" cy="25" r="3.5" fill="var(--sprite-highlight, #00d4ff)" opacity="0.7" />
      <circle cx="32" cy="25" r="1.5" fill="#67e8f9" opacity="0.9" />

      {/* Energy conduit lines from base to core — consolidated to 2 bold lines */}
      <line x1="24" y1="56" x2="26" y2="30" stroke="var(--sprite-highlight, #00d4ff)" strokeWidth="1.2" opacity="0.55" />
      <line x1="40" y1="56" x2="38" y2="30" stroke="var(--sprite-highlight, #00d4ff)" strokeWidth="1.2" opacity="0.55" />

      {/* Disproportionately long left arm — three-fingered claw */}
      <path d="M18 14 L20 12 L16 38 L12 40 Z" fill="var(--sprite-primary, #1e293b)" opacity="0.75" />
      <line x1="12" y1="40" x2="6" y2="44" stroke="var(--sprite-accent, #334155)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="12" y1="40" x2="8" y2="46" stroke="var(--sprite-accent, #334155)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="12" y1="40" x2="12" y2="48" stroke="var(--sprite-accent, #334155)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

      {/* Disproportionately long right arm */}
      <path d="M44 12 L46 14 L50 38 L46 40 Z" fill="var(--sprite-primary, #1e293b)" opacity="0.75" />
      <line x1="50" y1="38" x2="56" y2="42" stroke="var(--sprite-accent, #334155)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="50" y1="38" x2="54" y2="44" stroke="var(--sprite-accent, #334155)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="50" y1="38" x2="50" y2="46" stroke="var(--sprite-accent, #334155)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

      {/* Fused pillar legs / pedestal */}
      <path d="M22 40 L42 40 L40 56 L24 56 Z" fill="var(--sprite-primary, #1e293b)" opacity="0.7" />
      <rect x="20" y="54" width="24" height="4" rx="1.5" fill="var(--sprite-accent, #334155)" opacity="0.65" />
    </svg>
  );
}
