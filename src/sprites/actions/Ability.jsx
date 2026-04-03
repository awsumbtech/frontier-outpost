export default function AbilitySprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Four-pointed starburst */}
      <path d="M32 4 L36 26 L58 32 L36 38 L32 60 L28 38 L6 32 L28 26 Z" fill="currentColor" opacity="0.8" />
      {/* Inner star */}
      <path d="M32 16 L34 28 L46 32 L34 36 L32 48 L30 36 L18 32 L30 28 Z" fill="currentColor" opacity="0.55" />
      {/* Center circle */}
      <circle cx="32" cy="32" r="3" fill="currentColor" opacity="0.9" />
    </svg>
  );
}
