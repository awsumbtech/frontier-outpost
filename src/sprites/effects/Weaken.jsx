export default function WeakenSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Downward broken arrow */}
      {/* Upper shaft */}
      <line x1="32" y1="8" x2="32" y2="24" stroke="#f87171" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
      {/* Lower shaft */}
      <line x1="32" y1="30" x2="32" y2="44" stroke="#f87171" strokeWidth="3.5" strokeLinecap="round" opacity="0.72" />
      {/* Arrowhead pointing down */}
      <path d="M24 38 L32 50 L40 38" fill="none" stroke="#f87171" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      {/* Crack detail — bumped to be visible */}
      <line x1="30" y1="25" x2="34" y2="29" stroke="#f87171" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}
