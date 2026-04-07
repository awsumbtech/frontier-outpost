export default function BleedSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Diagonal slash line behind */}
      <line x1="14" y1="52" x2="50" y2="12" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
      {/* Three droplets in triangular arrangement */}
      <path d="M22 20 Q22 14 26 14 Q30 14 30 20 Q30 26 26 28 Q22 26 22 20 Z" fill="#f87171" opacity="0.85" />
      <path d="M34 24 Q34 18 38 18 Q42 18 42 24 Q42 30 38 32 Q34 30 34 24 Z" fill="#f87171" opacity="0.78" />
      <path d="M24 38 Q24 32 28 32 Q32 32 32 38 Q32 44 28 46 Q24 44 24 38 Z" fill="#f87171" opacity="0.72" />
    </svg>
  );
}
