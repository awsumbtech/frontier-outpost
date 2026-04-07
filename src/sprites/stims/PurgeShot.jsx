export default function PurgeShotSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Starburst explosion */}
      <path d="M32 6 L36 24 L54 16 L42 30 L58 32 L42 34 L54 48 L36 40 L32 58 L28 40 L10 48 L22 34 L6 32 L22 30 L10 16 L28 24 Z" fill="#c084fc" opacity="0.6" />
      {/* Inner burst */}
      <path d="M32 18 L34 28 L44 24 L38 30 L46 32 L38 34 L44 40 L34 36 L32 46 L30 36 L20 40 L26 34 L18 32 L26 30 L20 24 L30 28 Z" fill="#c084fc" opacity="0.45" />
      {/* Clean center — purification */}
      <circle cx="32" cy="32" r="6" fill="#1e1b4b" opacity="0.65" />
      <circle cx="32" cy="32" r="3" fill="#e9d5ff" opacity="0.75" />
    </svg>
  );
}
