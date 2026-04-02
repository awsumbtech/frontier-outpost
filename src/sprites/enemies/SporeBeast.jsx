export default function SporeBeastSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Low wide body */}
      <ellipse cx="32" cy="40" rx="18" ry="10" fill="var(--sprite-primary, #6b7280)" opacity="0.75" />

      {/* Overlapping fungal plates on back */}
      <ellipse cx="24" cy="32" rx="8" ry="5" fill="var(--sprite-accent, #a855f7)" opacity="0.6" />
      <ellipse cx="32" cy="28" rx="10" ry="6" fill="var(--sprite-accent, #a855f7)" opacity="0.65" />
      <ellipse cx="40" cy="32" rx="8" ry="5" fill="var(--sprite-accent, #a855f7)" opacity="0.6" />
      <ellipse cx="32" cy="24" rx="7" ry="4" fill="var(--sprite-highlight, #c084fc)" opacity="0.55" />

      {/* Small head — no eyes, vertical mouth slit */}
      <ellipse cx="18" cy="38" rx="5" ry="4" fill="var(--sprite-primary, #6b7280)" opacity="0.8" />
      <line x1="16" y1="36" x2="16" y2="40" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />

      {/* Four thick stubby legs */}
      <rect x="18" y="46" width="5" height="8" rx="1.5" fill="var(--sprite-primary, #6b7280)" opacity="0.75" />
      <rect x="27" y="48" width="5" height="8" rx="1.5" fill="var(--sprite-primary, #6b7280)" opacity="0.7" />
      <rect x="35" y="48" width="5" height="8" rx="1.5" fill="var(--sprite-primary, #6b7280)" opacity="0.7" />
      <rect x="43" y="46" width="5" height="8" rx="1.5" fill="var(--sprite-primary, #6b7280)" opacity="0.75" />

      {/* Floating spore clouds — intentionally lighter, still bumped */}
      <circle cx="22" cy="18" r="2.5" fill="var(--sprite-highlight, #c084fc)" opacity="0.45" />
      <circle cx="34" cy="14" r="3" fill="var(--sprite-highlight, #c084fc)" opacity="0.4" />
      <circle cx="42" cy="20" r="2" fill="var(--sprite-highlight, #c084fc)" opacity="0.38" />
      <circle cx="28" cy="12" r="2" fill="var(--sprite-highlight, #c084fc)" opacity="0.32" />
    </svg>
  );
}
