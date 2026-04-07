export default function SlowSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Clock face */}
      <circle cx="28" cy="32" r="16" fill="none" stroke="#60a5fa" strokeWidth="2.5" opacity="0.8" />
      <circle cx="28" cy="32" r="14" fill="#60a5fa" opacity="0.2" />
      {/* Clock hands */}
      <line x1="28" y1="32" x2="28" y2="22" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      <line x1="28" y1="32" x2="36" y2="36" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      {/* Center dot */}
      <circle cx="28" cy="32" r="2" fill="#60a5fa" opacity="0.95" />
      {/* Motion lines trailing behind — indicating slowness */}
      <line x1="48" y1="26" x2="54" y2="26" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
      <line x1="46" y1="32" x2="56" y2="32" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="48" y1="38" x2="54" y2="38" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
