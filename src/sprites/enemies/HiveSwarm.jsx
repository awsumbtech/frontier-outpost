export default function HiveSwarmSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Cloud mass — intentionally semi-transparent for "swarm" feel, but bumped */}
      <ellipse cx="32" cy="32" rx="20" ry="14" fill="var(--sprite-primary, #92400e)" opacity="0.3" />
      <ellipse cx="32" cy="32" rx="16" ry="11" fill="var(--sprite-primary, #92400e)" opacity="0.25" />

      {/* Outer boundary dots — bumped for visibility */}
      <circle cx="14" cy="28" r="1.2" fill="var(--sprite-accent, #fbbf24)" opacity="0.55" />
      <circle cx="16" cy="22" r="1" fill="var(--sprite-accent, #fbbf24)" opacity="0.5" />
      <circle cx="50" cy="30" r="1.2" fill="var(--sprite-accent, #fbbf24)" opacity="0.55" />
      <circle cx="48" cy="24" r="1" fill="var(--sprite-accent, #fbbf24)" opacity="0.5" />
      <circle cx="20" cy="42" r="1" fill="var(--sprite-accent, #fbbf24)" opacity="0.45" />
      <circle cx="44" cy="40" r="1" fill="var(--sprite-accent, #fbbf24)" opacity="0.45" />

      {/* Visible individual swarm members — small triangular shapes */}
      <path d="M26 26 L30 26 L28 22 Z" fill="var(--sprite-accent, #fbbf24)" opacity="0.8" />
      <path d="M34 30 L38 30 L36 26 Z" fill="var(--sprite-accent, #fbbf24)" opacity="0.75" />
      <path d="M28 36 L32 36 L30 32 Z" fill="var(--sprite-accent, #fbbf24)" opacity="0.7" />
      <path d="M38 34 L42 34 L40 30 Z" fill="var(--sprite-accent, #fbbf24)" opacity="0.65" />

      {/* More scattered dots — the mass */}
      <circle cx="24" cy="30" r="1.5" fill="var(--sprite-accent, #fbbf24)" opacity="0.6" />
      <circle cx="36" cy="24" r="1.2" fill="var(--sprite-accent, #fbbf24)" opacity="0.55" />
      <circle cx="40" cy="38" r="1.5" fill="var(--sprite-accent, #fbbf24)" opacity="0.55" />
      <circle cx="22" cy="36" r="1.2" fill="var(--sprite-accent, #fbbf24)" opacity="0.5" />
      <circle cx="32" cy="20" r="1" fill="var(--sprite-accent, #fbbf24)" opacity="0.45" />

      {/* Trailing edge dots — keep slightly lighter for fading effect */}
      <circle cx="10" cy="30" r="0.8" fill="var(--sprite-accent, #fbbf24)" opacity="0.3" />
      <circle cx="54" cy="32" r="0.8" fill="var(--sprite-accent, #fbbf24)" opacity="0.3" />
    </svg>
  );
}
