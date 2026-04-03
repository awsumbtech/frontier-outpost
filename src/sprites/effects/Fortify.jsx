export default function FortifySprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Upward chevron/shield */}
      <path d="M32 8 L48 20 L46 44 L32 56 L18 44 L16 20 Z" fill="#60a5fa" opacity="0.55" />
      <path d="M32 12 L44 22 L42 42 L32 52 L22 42 L20 22 Z" fill="none" stroke="#60a5fa" strokeWidth="1.8" opacity="0.75" />
      {/* Plus sign inside */}
      <line x1="32" y1="24" x2="32" y2="40" stroke="#00d4ff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      <line x1="24" y1="32" x2="40" y2="32" stroke="#00d4ff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      {/* Flanking armor plate lines */}
      <line x1="10" y1="28" x2="16" y2="28" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="48" y1="28" x2="54" y2="28" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
