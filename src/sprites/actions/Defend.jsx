export default function DefendSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Shield shape — rounded bottom, pointed top */}
      <path d="M32 6 L52 16 L50 42 L32 58 L14 42 L12 16 Z" fill="currentColor" opacity="0.7" />
      <path d="M32 10 L48 18 L46 40 L32 54 L18 40 L16 18 Z" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.65" />
      {/* Horizontal bar across middle */}
      <line x1="20" y1="30" x2="44" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      {/* Chevron detail at center */}
      <path d="M28 34 L32 28 L36 34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}
