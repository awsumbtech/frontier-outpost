export default function PoisonSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Bubbling vial */}
      <path d="M24 22 L24 48 Q24 54 32 54 Q40 54 40 48 L40 22 Z" fill="#a855f7" opacity="0.6" />
      <rect x="26" y="18" width="12" height="6" rx="1" fill="#a855f7" opacity="0.75" />
      {/* Liquid level inside */}
      <path d="M26 36 L38 36 L38 48 Q38 52 32 52 Q26 52 26 48 Z" fill="#a855f7" opacity="0.7" />
      {/* Rising bubbles */}
      <circle cx="30" cy="30" r="2" fill="#c084fc" opacity="0.65" />
      <circle cx="34" cy="24" r="1.5" fill="#c084fc" opacity="0.6" />
      <circle cx="28" cy="16" r="1.8" fill="#c084fc" opacity="0.55" />
      <circle cx="36" cy="12" r="1.2" fill="#c084fc" opacity="0.5" />
    </svg>
  );
}
