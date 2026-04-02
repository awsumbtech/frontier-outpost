export default function PsiWraithSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Hood — intentionally semi-transparent for ghostly feel, but bumped */}
      <path d="M22 8 L42 6 L44 20 L38 24 L26 24 L20 20 Z" fill="var(--sprite-primary, #e0e7ff)" opacity="0.55" />
      {/* Inner hood void */}
      <path d="M26 12 L38 11 L40 20 L36 22 L28 22 L24 18 Z" fill="#1e1b4b" opacity="0.7" />

      {/* Two glowing eyes offset vertically — unsettling */}
      <circle cx="30" cy="15" r="1.5" fill="var(--sprite-highlight, #c084fc)" opacity="0.95" />
      <circle cx="35" cy="18" r="1.5" fill="var(--sprite-highlight, #c084fc)" opacity="0.95" />

      {/* Spectral upper body — intentionally translucent, bumped */}
      <path d="M26 24 L38 24 L40 44 L24 46 Z" fill="var(--sprite-primary, #e0e7ff)" opacity="0.45" />
      <path d="M28 28 L36 28 L38 40 L26 42 Z" fill="var(--sprite-primary, #e0e7ff)" opacity="0.3" />

      {/* Detached floating arms */}
      <path d="M20 26 L22 24 L20 40 L16 42 Z" fill="var(--sprite-primary, #e0e7ff)" opacity="0.4" />
      <path d="M42 24 L44 26 L46 40 L42 42 Z" fill="var(--sprite-primary, #e0e7ff)" opacity="0.4" />
      {/* Spectral hand glow */}
      <circle cx="16" cy="42" r="2.5" fill="var(--sprite-highlight, #c084fc)" opacity="0.55" />
      <circle cx="46" cy="40" r="2.5" fill="var(--sprite-highlight, #c084fc)" opacity="0.55" />

      {/* Fading tendrils — intentionally wispy, bumped slightly */}
      <path d="M26 44 L30 44 L28 56 L24 58" fill="none" stroke="var(--sprite-primary, #e0e7ff)" strokeWidth="1.8" opacity="0.35" strokeLinecap="round" />
      <path d="M34 44 L38 44 L36 54 L40 58" fill="none" stroke="var(--sprite-primary, #e0e7ff)" strokeWidth="1.8" opacity="0.28" strokeLinecap="round" />
      <path d="M30 46 L32 56 L30 60" fill="none" stroke="var(--sprite-primary, #e0e7ff)" strokeWidth="1.2" opacity="0.22" strokeLinecap="round" />

      {/* Phasing outline — remove strokes thinner than 0.6, bump to 0.8 */}
      <path d="M22 10 L20 20 L24 46" fill="none" stroke="var(--sprite-highlight, #c084fc)" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.4" />
      <path d="M42 8 L44 20 L40 46" fill="none" stroke="var(--sprite-highlight, #c084fc)" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.4" />
    </svg>
  );
}
